import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  getDayEntries, listDayEntries, listIntakes, listMedications, saveDayEntries, setIntake,
  type DayEntries, type Intake, type IntakeStatus, type Medication,
} from '../db/repo.ts';
import { EMERGENCIAS_PERU, sustainedHighPain } from '../logic/alerts.ts';
import { analgesicDays } from '../logic/ciclo.ts';
import { addDays, formatShort, today } from '../logic/dates.ts';
import { evaluateFlags, modulesFor, redFlagsFor, reliefsFor, triggersFor } from '../modules/index.ts';
import type { ConditionId, EntryData, EntryValue, ModuleDef } from '../modules/types.ts';
import { Banner, Body, Button, Card, ChipGroup, Subtitle, Title } from '../ui/components.tsx';
import { FieldInput } from '../ui/FieldInput.tsx';
import { Input } from '../ui/keyboard.tsx';
import { colors, space } from '../ui/theme.ts';

const asList = (v: EntryValue | undefined): string[] => (Array.isArray(v) ? v : []);

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

type Warning = { key: string; text: string };

export function HoyScreen({ profile }: { profile: ConditionId[] }) {
  const modules = modulesFor(profile);
  const [date, setDate] = useState(today());
  const [entries, setEntries] = useState<DayEntries>({});
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);

  const computeWarnings = useCallback(async () => {
    const recent = await listDayEntries(addDays(today(), -29));
    const list: Warning[] = [];
    for (const m of modules) {
      const last3 = recent
        .filter((r) => r.date > addDays(today(), -3))
        .map((r) => r.entries[m.id]?.[m.main.id])
        .filter((v): v is number => typeof v === 'number');
      if (sustainedHighPain(last3)) {
        list.push({ key: `alto-${m.id}`, text: `${m.main.short}: 3 días seguidos en 7 o más. Te recomendamos pedir una cita con tu médico.` });
      }
    }
    if (profile.includes('cefalea')) {
      const days = analgesicDays(
        recent.map((r) => ({ date: r.date, otros: asList(r.entries.cefalea?.otros) })),
        today(),
      );
      if (days >= 10) {
        list.push({
          key: 'analgesicos',
          text: `Tomaste analgésicos ${days} de los últimos 30 días. Usarlos 10 días o más al mes puede causar más dolor de cabeza (cefalea por abuso de medicamentos). Coméntalo con tu médico.`,
        });
      }
    }
    setWarnings(list);
  }, [modules, profile]);

  const load = useCallback(async () => {
    setEntries(await getDayEntries(date));
    setSaved(false);
    setMeds(await listMedications());
    setIntakes(await listIntakes(date));
    await computeWarnings();
  }, [date, computeWarnings]);

  useEffect(() => {
    load();
    // Solo al cambiar de fecha o de perfil (load cambia en cada render).
  }, [date, profile.join(',')]);

  const setField = (module: string, id: string, value: EntryValue | undefined) => {
    setEntries((prev) => {
      const data: EntryData = { ...(prev[module] ?? {}) };
      if (value === undefined) delete data[id];
      else data[id] = value;
      return { ...prev, [module]: data };
    });
    setSaved(false);
  };

  const general = entries.general ?? {};
  const missing = modules.filter((m) => typeof entries[m.id]?.[m.main.id] !== 'number');
  const hasAny = modules.length === 0
    ? Object.keys(general).length > 0
    : missing.length < modules.length;

  const save = async () => {
    // Solo se guardan los módulos del perfil y la parte general.
    const toSave: DayEntries = { general };
    for (const m of modules) if (entries[m.id]) toSave[m.id] = entries[m.id];
    await saveDayEntries(date, toSave);
    setSaved(true);
    await computeWarnings();
  };

  const markIntake = async (medicationId: number, slot: string, status: IntakeStatus) => {
    const current = intakes.find((i) => i.medicationId === medicationId && i.slot === slot);
    const next = current?.status === status ? null : status; // tocar de nuevo desmarca
    await setIntake({ medicationId, date, slot, status: next });
    setIntakes(await listIntakes(date));
  };

  const flags = evaluateFlags(asList(general.flags), redFlagsFor(profile));
  const isToday = date === today();

  return (
    <View>
      <View style={styles.dateRow}>
        <Button kind="secondary" label="‹" onPress={() => setDate(addDays(date, -1))} />
        <Title>{isToday ? 'Hoy' : formatShort(date)}</Title>
        <Button kind="secondary" label="›" disabled={isToday} onPress={() => setDate(addDays(date, 1))} />
      </View>

      {flags.urgent.length > 0 && (
        <Banner kind="danger">
          {flags.urgent.map((f) => <Body key={f.id}>⚠️ {f.advice}</Body>)}
          <View style={{ marginTop: space.sm }}>
            {EMERGENCIAS_PERU.map((e) => (
              <Button key={e.phone} kind="danger" label={`Llamar ${e.label}: ${e.phone}`} onPress={() => Linking.openURL(`tel:${e.phone}`)} />
            ))}
          </View>
        </Banner>
      )}
      {flags.soon.length > 0 && (
        <Banner kind="warn">
          {flags.soon.map((f) => <Body key={f.id}>• {f.advice}</Body>)}
        </Banner>
      )}
      {isToday && warnings.map((w) => (
        <Banner key={w.key} kind="warn"><Body>{w.text}</Body></Banner>
      ))}

      {meds.length > 0 && (
        <Card>
          <Subtitle>💊 Medicamentos</Subtitle>
          {meds.flatMap((m) =>
            (m.times.length ? m.times : ['—']).map((slot) => {
              const status = intakes.find((i) => i.medicationId === m.id && i.slot === slot)?.status;
              return (
                <View key={`${m.id}-${slot}`} style={styles.medRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medName}>{m.name}</Text>
                    <Text style={styles.medInfo}>{slot === '—' ? 'Sin horario' : slot}{m.dose ? ` · ${m.dose}` : ''}</Text>
                  </View>
                  <Text
                    accessibilityRole="button"
                    onPress={() => markIntake(m.id, slot, 'tomada')}
                    style={[styles.pill, status === 'tomada' && { backgroundColor: colors.ok, color: '#FFF' }]}
                  >
                    ✓ Tomada
                  </Text>
                  <Text
                    accessibilityRole="button"
                    onPress={() => markIntake(m.id, slot, 'omitida')}
                    style={[styles.pill, status === 'omitida' && { backgroundColor: colors.warn, color: '#FFF' }]}
                  >
                    Omitida
                  </Text>
                </View>
              );
            }),
          )}
        </Card>
      )}

      {modules.map((m) => (
        <ModuleCard
          key={m.id}
          module={m}
          data={entries[m.id] ?? {}}
          open={!!open[m.id]}
          onToggleOpen={() => setOpen((o) => ({ ...o, [m.id]: !o[m.id] }))}
          onChange={(id, v) => setField(m.id, id, v)}
        />
      ))}

      <Card>
        <Subtitle>¿Qué hubo en el día?</Subtitle>
        <Body muted>Sirve para descubrir qué te empeora.</Body>
        <View style={{ height: space.sm }} />
        <ChipGroup items={triggersFor(profile)} selected={asList(general.triggers)}
          onToggle={(id) => setField('general', 'triggers', toggle(asList(general.triggers), id))} />
      </Card>

      <Card>
        <Subtitle>¿Qué hiciste para sentirte mejor?</Subtitle>
        <ChipGroup items={reliefsFor(profile)} selected={asList(general.reliefs)}
          onToggle={(id) => setField('general', 'reliefs', toggle(asList(general.reliefs), id))} />
      </Card>

      {modules.length > 0 && (
        <Card>
          <Subtitle>Señales de alarma</Subtitle>
          <Body muted>Marca solo si te pasó.</Body>
          <View style={{ height: space.sm }} />
          <ChipGroup items={redFlagsFor(profile)} selected={asList(general.flags)}
            onToggle={(id) => setField('general', 'flags', toggle(asList(general.flags), id))} />
        </Card>
      )}

      <Card>
        <Subtitle>¿Cómo te sentiste?</Subtitle>
        <Input
          style={styles.notes}
          multiline
          maxLength={2000}
          placeholder="Anota lo que quieras: sensaciones, lo que comiste, cómo dormiste…"
          placeholderTextColor={colors.muted}
          value={typeof general.notes === 'string' ? general.notes : ''}
          onChangeText={(t) => setField('general', 'notes', t)}
          autoCorrect
        />
      </Card>

      <Button label={saved ? 'Guardado ✓' : 'Guardar registro'} disabled={!hasAny || saved} onPress={save} />
      {missing.length > 0 && missing.length < modules.length && (
        <Text style={styles.hint}>Sin marcar: {missing.map((m) => m.main.short).join(', ')}. Puedes guardar igual.</Text>
      )}
      {!hasAny && <Text style={styles.hint}>Marca al menos un valor para poder guardar.</Text>}
    </View>
  );
}

function ModuleCard({
  module, data, open, onToggleOpen, onChange,
}: {
  module: ModuleDef; data: EntryData; open: boolean;
  onToggleOpen: () => void; onChange: (id: string, v: EntryValue | undefined) => void;
}) {
  return (
    <Card>
      <Subtitle>{module.emoji} {module.name}</Subtitle>
      {module.fields.map((f) => (
        <FieldInput key={f.id} field={f} value={data[f.id]} onChange={(v) => onChange(f.id, v)} />
      ))}
      {module.details.length > 0 && (
        <Pressable onPress={onToggleOpen} accessibilityRole="button">
          <Text style={styles.more}>{open ? 'Menos detalles ▲' : 'Más detalles ▼'}</Text>
        </Pressable>
      )}
      {open && module.details.map((f) => (
        <FieldInput key={f.id} field={f} value={data[f.id]} onChange={(v) => onChange(f.id, v)} />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm, borderTopWidth: 1, borderTopColor: colors.border },
  medName: { fontSize: 15, fontWeight: '600', color: colors.text },
  medInfo: { fontSize: 13, color: colors.muted },
  pill: {
    fontSize: 13, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border, color: colors.text,
  },
  notes: {
    minHeight: 90, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: space.md, fontSize: 15, color: colors.text, textAlignVertical: 'top',
  },
  more: { color: colors.primary, fontWeight: '600', paddingVertical: space.sm },
  hint: { textAlign: 'center', color: colors.muted, marginTop: space.sm },
});

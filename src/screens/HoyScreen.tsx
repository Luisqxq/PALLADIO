import { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  getDailyLog, listDailyLogs, listIntakes, listMedications, saveDailyLog, setIntake,
  type DailyLog, type Intake, type IntakeStatus, type Medication,
} from '../db/repo.ts';
import { EMERGENCIAS_PERU, evaluateFlags, RED_FLAGS, sustainedHighPain } from '../logic/alerts.ts';
import { PAIN_LOCATIONS, RELIEFS, TRIGGERS, URINARY_SYMPTOMS } from '../logic/catalog.ts';
import { addDays, formatShort, today } from '../logic/dates.ts';
import { Banner, Body, Button, Card, ChipGroup, ScaleSelector, Stepper, Subtitle, Title } from '../ui/components.tsx';
import { colors, space } from '../ui/theme.ts';

const empty = (date: string): DailyLog => ({
  date, pain: 0, locations: [], urinary: [], nocturia: 0, triggers: [], reliefs: [], flags: [], notes: '',
});

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function HoyScreen() {
  const [date, setDate] = useState(today());
  const [log, setLog] = useState<DailyLog>(empty(date));
  const [painSet, setPainSet] = useState(false);
  const [saved, setSaved] = useState(false);
  const [highPainStreak, setHighPainStreak] = useState(false);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);

  const load = useCallback(async () => {
    const existing = await getDailyLog(date);
    setLog(existing ?? empty(date));
    setPainSet(!!existing);
    setSaved(!!existing);
    setMeds(await listMedications());
    setIntakes(await listIntakes(date));
    const recent = await listDailyLogs(addDays(today(), -2));
    setHighPainStreak(sustainedHighPain(recent.map((r) => r.pain)));
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (patch: Partial<DailyLog>) => {
    setLog((l) => ({ ...l, ...patch }));
    setSaved(false);
  };

  const save = async () => {
    await saveDailyLog(log);
    setSaved(true);
    const recent = await listDailyLogs(addDays(today(), -2));
    setHighPainStreak(sustainedHighPain(recent.map((r) => r.pain)));
  };

  const markIntake = async (medicationId: number, slot: string, status: IntakeStatus) => {
    const current = intakes.find((i) => i.medicationId === medicationId && i.slot === slot);
    const next = current?.status === status ? null : status; // tocar de nuevo desmarca
    await setIntake({ medicationId, date, slot, status: next });
    setIntakes(await listIntakes(date));
  };

  const flags = evaluateFlags(log.flags);
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
          {flags.urgent.map((f) => (
            <Body key={f.id}>⚠️ {f.advice}</Body>
          ))}
          <View style={styles.phones}>
            {EMERGENCIAS_PERU.map((e) => (
              <Button key={e.phone} kind="danger" label={`Llamar ${e.label}: ${e.phone}`} onPress={() => Linking.openURL(`tel:${e.phone}`)} />
            ))}
          </View>
        </Banner>
      )}
      {flags.soon.length > 0 && (
        <Banner kind="warn">
          {flags.soon.map((f) => (
            <Body key={f.id}>• {f.advice}</Body>
          ))}
        </Banner>
      )}
      {highPainStreak && (
        <Banner kind="warn">
          <Body>Llevas 3 días seguidos con dolor de 7 o más. Te recomendamos pedir una cita con tu urólogo.</Body>
        </Banner>
      )}

      {meds.length > 0 && (
        <Card>
          <Subtitle>Medicamentos</Subtitle>
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

      <Card>
        <Subtitle>¿Cuánto dolor sentiste {isToday ? 'hoy' : 'ese día'}?</Subtitle>
        <Body muted>0 = nada · 10 = el peor imaginable</Body>
        <View style={{ height: space.sm }} />
        <ScaleSelector value={painSet ? log.pain : null} onChange={(v) => { setPainSet(true); update({ pain: v }); }} />
      </Card>

      <Card>
        <Subtitle>¿Dónde?</Subtitle>
        <ChipGroup items={PAIN_LOCATIONS} selected={log.locations} onToggle={(id) => update({ locations: toggle(log.locations, id) })} />
      </Card>

      <Card>
        <Subtitle>Al orinar</Subtitle>
        <ChipGroup items={URINARY_SYMPTOMS} selected={log.urinary} onToggle={(id) => update({ urinary: toggle(log.urinary, id) })} />
        <View style={{ height: space.md }} />
        <Body>¿Cuántas veces te levantaste de noche a orinar?</Body>
        <View style={{ height: space.sm }} />
        <Stepper value={log.nocturia} onChange={(v) => update({ nocturia: v })} />
      </Card>

      <Card>
        <Subtitle>¿Qué hubo en el día?</Subtitle>
        <Body muted>Sirve para descubrir qué te empeora.</Body>
        <View style={{ height: space.sm }} />
        <ChipGroup items={TRIGGERS} selected={log.triggers} onToggle={(id) => update({ triggers: toggle(log.triggers, id) })} />
      </Card>

      <Card>
        <Subtitle>¿Qué hiciste para sentirte mejor?</Subtitle>
        <ChipGroup items={RELIEFS} selected={log.reliefs} onToggle={(id) => update({ reliefs: toggle(log.reliefs, id) })} />
      </Card>

      <Card>
        <Subtitle>Señales de alarma</Subtitle>
        <Body muted>Marca solo si te pasó.</Body>
        <View style={{ height: space.sm }} />
        <ChipGroup items={RED_FLAGS} selected={log.flags} onToggle={(id) => update({ flags: toggle(log.flags, id) })} />
      </Card>

      <Card>
        <Subtitle>¿Cómo te sentiste?</Subtitle>
        <TextInput
          style={styles.notes}
          multiline
          maxLength={2000}
          placeholder="Anota lo que quieras: sensaciones, lo que comiste, cómo dormiste…"
          placeholderTextColor={colors.muted}
          value={log.notes}
          onChangeText={(t) => update({ notes: t })}
          autoCorrect
        />
      </Card>

      <Button label={saved ? 'Guardado ✓' : 'Guardar registro'} disabled={!painSet || saved} onPress={save} />
      {!painSet && <Text style={styles.hint}>Elige tu nivel de dolor para poder guardar.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  phones: { marginTop: space.sm },
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
  hint: { textAlign: 'center', color: colors.muted, marginTop: space.sm },
});

import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { FOOD_PREFER, FOOD_TIPS, limitsFor, MENUS, menuIndexFor, TIPS_AHORRO } from '../content/alimentacion.ts';
import { DISCLAIMER, habitsFor, precautionsFor } from '../content/habitos.ts';
import { EVIDENCE_INFO, REMEDIES, type Evidence } from '../content/remedios.ts';
import { listFamilyHistory } from '../db/repo.ts';
import { EMERGENCIAS_PERU } from '../logic/alerts.ts';
import { recommendations, type Recommendation } from '../logic/antecedentes.ts';
import { addDays, formatShort, today } from '../logic/dates.ts';
import { modulesFor, redFlagsFor } from '../modules/index.ts';
import type { ConditionId } from '../modules/types.ts';
import { Badge, Banner, Body, Button, Card, Subtitle, Title } from '../ui/components.tsx';
import { colors, space } from '../ui/theme.ts';
import { MedlinePlusSection } from './MedlinePlusSection.tsx';

type Section = 'remedios' | 'alimentacion' | 'habitos' | 'prevencion' | 'medline' | 'alarma';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'remedios', label: '🌿 Remedios' },
  { id: 'alimentacion', label: '🥗 Alimentación' },
  { id: 'habitos', label: '🚶 Hábitos' },
  { id: 'prevencion', label: '🧬 Prevención' },
  { id: 'medline', label: '📚 MedlinePlus' },
  { id: 'alarma', label: '🚨 Alarmas' },
];

// Lunes de la semana de una fecha.
function mondayOf(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay() || 7;
  return addDays(iso, 1 - day);
}

export function GuiaScreen({ profile }: { profile: ConditionId[] }) {
  const modules = modulesFor(profile);
  const [section, setSection] = useState<Section>('remedios');
  const [filter, setFilter] = useState<ConditionId | null>(modules[0]?.id ?? null);
  const [open, setOpen] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [recs, setRecs] = useState<Recommendation[]>([]);

  useEffect(() => {
    listFamilyHistory().then((items) => setRecs(recommendations(items)));
  }, []);

  const remedies = REMEDIES.filter((r) => (filter ? r.for.includes(filter) : r.for.some((c) => profile.includes(c))));
  const weekStart = addDays(mondayOf(today()), weekOffset * 7);
  const menu = MENUS[menuIndexFor(weekStart)];
  const flags = redFlagsFor(profile);
  const medlineTopics = [...new Set(modules.flatMap((m) => m.medlineTopics))];

  return (
    <View>
      <Title>Guía</Title>
      <View style={styles.tabs}>
        {SECTIONS.map((s) => (
          <Pressable key={s.id} onPress={() => setSection(s.id)} style={[styles.tab, section === s.id && styles.tabOn]}>
            <Text style={[styles.tabText, section === s.id && styles.tabTextOn]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      {section === 'remedios' && (
        <>
          <Body muted>Medicina tradicional y moderna, con su nivel de evidencia. Toca cada una para ver más.</Body>
          {modules.length > 1 && (
            <View style={[styles.tabs, { marginTop: space.md }]}>
              {modules.map((m) => (
                <Pressable key={m.id} onPress={() => setFilter(m.id)} style={[styles.tab, filter === m.id && styles.tabOn]}>
                  <Text style={[styles.tabText, filter === m.id && styles.tabTextOn]}>{m.emoji} {m.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {modules.length === 0 && (
            <Card><Body muted>Agrega tus condiciones en Ajustes → Mi perfil para ver los remedios que te corresponden.</Body></Card>
          )}
          {remedies.map((r) => {
            const ev = EVIDENCE_INFO[r.evidence];
            const isOpen = open === r.id;
            return (
              <Pressable key={r.id} onPress={() => setOpen(isOpen ? null : r.id)}>
                <Card>
                  <Badge label={ev.label} color={ev.color} bg={ev.bg} />
                  <Subtitle>{r.name}</Subtitle>
                  <Body>{r.summary}</Body>
                  {isOpen && (
                    <View style={{ marginTop: space.sm }}>
                      {r.how && (<><Text style={styles.label}>Cómo se usa</Text><Body>{r.how}</Body></>)}
                      <Text style={styles.label}>Precauciones</Text>
                      <Body>{r.cautions}</Body>
                      <Text style={styles.label}>Fuente</Text>
                      <Body muted>{r.source}</Body>
                    </View>
                  )}
                  <Text style={styles.more}>{isOpen ? 'Ver menos' : 'Ver más'}</Text>
                </Card>
              </Pressable>
            );
          })}
          <Card>
            <Subtitle>¿Qué significa cada etiqueta?</Subtitle>
            {(Object.keys(EVIDENCE_INFO) as Evidence[]).map((k) => (
              <View key={k} style={{ marginBottom: space.sm }}>
                <Badge label={EVIDENCE_INFO[k].label} color={EVIDENCE_INFO[k].color} bg={EVIDENCE_INFO[k].bg} />
                <Body muted>{EVIDENCE_INFO[k].detail}</Body>
              </View>
            ))}
            <Body>"Natural" no siempre significa inofensivo: algunas plantas interactúan con medicamentos. Coméntale a tu médico lo que tomas.</Body>
          </Card>
        </>
      )}

      {section === 'alimentacion' && (
        <>
          <Card>
            <Subtitle>Menú de la semana</Subtitle>
            <View style={styles.weekRow}>
              <Button kind="secondary" label="‹" onPress={() => setWeekOffset(weekOffset - 1)} />
              <Text style={styles.weekText}>
                {weekOffset === 0 ? 'Esta semana' : weekOffset === 1 ? 'Próxima semana' : weekOffset === -1 ? 'Semana pasada' : ''}
                {'\n'}{formatShort(weekStart)} – {formatShort(addDays(weekStart, 6))}
              </Text>
              <Button kind="secondary" label="›" onPress={() => setWeekOffset(weekOffset + 1)} />
            </View>
            {menu.map((d) => (
              <View key={d.day} style={styles.menuDay}>
                <Text style={styles.food}>{d.day}</Text>
                <Body>☀️ {d.desayuno}</Body>
                <Body>🍲 {d.almuerzo}</Body>
                <Body>🌙 {d.cena}</Body>
              </View>
            ))}
            <Body muted>El menú cambia cada lunes. Es suave, sin picante y económico. Ajusta las porciones a tu hambre.</Body>
          </Card>
          {FOOD_TIPS.filter((t) => profile.includes(t.for)).length > 0 && (
            <Card>
              <Subtitle>Para tus condiciones</Subtitle>
              {FOOD_TIPS.filter((t) => profile.includes(t.for)).map((t) => <Body key={t.for}>• {t.text}</Body>)}
            </Card>
          )}
          {FOOD_PREFER.map((g) => (
            <Card key={g.title}>
              <Subtitle>{g.title}</Subtitle>
              {g.items.map((i) => (
                <View key={i.name} style={{ marginBottom: space.sm }}>
                  <Text style={styles.food}>{i.name}</Text>
                  <Body muted>{i.why}</Body>
                </View>
              ))}
            </Card>
          ))}
          {limitsFor(profile).length > 0 && (
            <Card>
              <Subtitle>Mejor limitar</Subtitle>
              {limitsFor(profile).map((i) => (
                <View key={i.name} style={{ marginBottom: space.sm }}>
                  <Text style={styles.food}>{i.name}</Text>
                  <Body muted>{i.why}</Body>
                </View>
              ))}
              <Body>No todos reaccionan igual: usa tu registro diario para descubrir qué te afecta a ti.</Body>
            </Card>
          )}
          <Card>
            <Subtitle>Para ahorrar</Subtitle>
            {TIPS_AHORRO.map((t) => <Body key={t}>• {t}</Body>)}
          </Card>
        </>
      )}

      {section === 'habitos' && (
        <>
          {precautionsFor(profile).length > 0 && (
            <>
              <Subtitle>⚠️ Precauciones para tu combinación de condiciones</Subtitle>
              {precautionsFor(profile).map((p) => (
                <Banner key={p.title} kind="warn">
                  <Text style={styles.food}>{p.title}</Text>
                  <Body>{p.text}</Body>
                </Banner>
              ))}
            </>
          )}
          {habitsFor(profile).map((h) => (
            <Card key={h.title}>
              <Subtitle>{h.title}</Subtitle>
              <Body>{h.text}</Body>
            </Card>
          ))}
        </>
      )}

      {section === 'prevencion' && (
        <>
          <Body muted>Recomendaciones según tus antecedentes familiares. Agrégalos en Ajustes → Antecedentes familiares.</Body>
          <View style={{ height: space.md }} />
          {recs.length === 0 && (
            <Card><Body muted>Aún no registraste antecedentes familiares.</Body></Card>
          )}
          {recs.map((r) => (
            <Card key={r.condition}>
              <Badge
                label={r.closest === 1 ? 'Familiar directo' : 'Familiar lejano'}
                color={r.closest === 1 ? colors.warn : colors.muted}
                bg={r.closest === 1 ? colors.warnSoft : colors.primarySoft}
              />
              <Subtitle>{r.label}</Subtitle>
              <Body muted>{r.relatives.join(', ')}</Body>
              <View style={{ height: space.sm }} />
              <Body>{r.text}</Body>
            </Card>
          ))}
          <Body muted>Son orientaciones generales. Tu médico decide qué controles necesitas y cada cuánto.</Body>
        </>
      )}

      {section === 'medline' && <MedlinePlusSection suggested={medlineTopics} />}

      {section === 'alarma' && (
        <>
          <Banner kind="danger">
            <Body>Si tienes alguna de estas señales, no esperes: busca atención médica.</Body>
          </Banner>
          {flags.map((f) => (
            <Card key={f.id}>
              <Badge
                label={f.urgent ? 'Urgente: ve a emergencia' : 'Consulta pronto'}
                color={f.urgent ? colors.danger : colors.warn}
                bg={f.urgent ? colors.dangerSoft : colors.warnSoft}
              />
              <Subtitle>{f.label}</Subtitle>
              <Body>{f.advice}</Body>
            </Card>
          ))}
          <Card>
            <Subtitle>Números de emergencia en Perú</Subtitle>
            {EMERGENCIAS_PERU.map((e) => (
              <Button key={e.phone} kind="secondary" label={`${e.label}: ${e.phone}`} onPress={() => Linking.openURL(`tel:${e.phone}`)} />
            ))}
          </Card>
        </>
      )}

      <View style={{ height: space.md }} />
      <Body muted>{DISCLAIMER}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tabOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 14, color: colors.text },
  tabTextOn: { color: '#FFFFFF', fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '700', color: colors.primary, marginTop: space.sm, marginBottom: 2, textTransform: 'uppercase' },
  more: { color: colors.primary, fontWeight: '600', marginTop: space.sm },
  food: { fontSize: 15, fontWeight: '600', color: colors.text },
  menuDay: { paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  weekRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekText: { textAlign: 'center', color: colors.text, fontWeight: '600' },
});

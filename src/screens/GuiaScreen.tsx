import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { FOOD_LIMIT, FOOD_PREFER, MENU_ECONOMICO, TIPS_AHORRO } from '../content/alimentacion.ts';
import { DISCLAIMER, HABITS } from '../content/habitos.ts';
import { EVIDENCE_INFO, REMEDIES, type Evidence } from '../content/remedios.ts';
import { EMERGENCIAS_PERU, RED_FLAGS } from '../logic/alerts.ts';
import { MedlinePlusSection } from './MedlinePlusSection.tsx';
import { Badge, Banner, Body, Button, Card, Subtitle, Title } from '../ui/components.tsx';
import { colors, space } from '../ui/theme.ts';

type Section = 'alarma' | 'remedios' | 'alimentacion' | 'habitos' | 'medline';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'remedios', label: '🌿 Remedios' },
  { id: 'alimentacion', label: '🥗 Alimentación' },
  { id: 'habitos', label: '🚶 Hábitos' },
  { id: 'medline', label: '📚 MedlinePlus' },
  { id: 'alarma', label: '🚨 Alarmas' },
];

export function GuiaScreen() {
  const [section, setSection] = useState<Section>('remedios');
  const [filter, setFilter] = useState<'prostata' | 'colon'>('prostata');
  const [open, setOpen] = useState<string | null>(null);

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
          <View style={[styles.tabs, { marginTop: space.md }]}>
            <Pressable onPress={() => setFilter('prostata')} style={[styles.tab, filter === 'prostata' && styles.tabOn]}>
              <Text style={[styles.tabText, filter === 'prostata' && styles.tabTextOn]}>Próstata</Text>
            </Pressable>
            <Pressable onPress={() => setFilter('colon')} style={[styles.tab, filter === 'colon' && styles.tabOn]}>
              <Text style={[styles.tabText, filter === 'colon' && styles.tabTextOn]}>Colon</Text>
            </Pressable>
          </View>
          {REMEDIES.filter((r) => r.for.includes(filter)).map((r) => {
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
                      {r.how && (
                        <>
                          <Text style={styles.label}>Cómo se usa</Text>
                          <Body>{r.how}</Body>
                        </>
                      )}
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
          <Body muted>Comer bien sin gastar mucho, con alimentos que se consiguen en cualquier mercado del Perú.</Body>
          <View style={{ height: space.md }} />
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
          <Card>
            <Subtitle>Mejor limitar</Subtitle>
            {FOOD_LIMIT.map((i) => (
              <View key={i.name} style={{ marginBottom: space.sm }}>
                <Text style={styles.food}>{i.name}</Text>
                <Body muted>{i.why}</Body>
              </View>
            ))}
            <Body>No todos reaccionan igual: usa tu registro diario para descubrir qué te afecta a ti.</Body>
          </Card>
          <Card>
            <Subtitle>Menú económico de ejemplo</Subtitle>
            {MENU_ECONOMICO.map((d) => (
              <View key={d.day} style={styles.menuDay}>
                <Text style={styles.food}>{d.day}</Text>
                <Body>☀️ {d.desayuno}</Body>
                <Body>🍲 {d.almuerzo}</Body>
                <Body>🌙 {d.cena}</Body>
              </View>
            ))}
          </Card>
          <Card>
            <Subtitle>Para ahorrar</Subtitle>
            {TIPS_AHORRO.map((t) => (
              <Body key={t}>• {t}</Body>
            ))}
          </Card>
        </>
      )}

      {section === 'habitos' && (
        <>
          {HABITS.map((h) => (
            <Card key={h.title}>
              <Subtitle>{h.title}</Subtitle>
              <Body>{h.text}</Body>
            </Card>
          ))}
        </>
      )}

      {section === 'medline' && <MedlinePlusSection />}

      {section === 'alarma' && (
        <>
          <Banner kind="danger">
            <Body>Si tienes alguna de estas señales, no esperes: busca atención médica.</Body>
          </Banner>
          {RED_FLAGS.map((f) => (
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
});

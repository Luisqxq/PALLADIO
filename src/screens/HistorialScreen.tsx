import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { listCpsi, listDailyLogs, type CpsiEntry, type DailyLog } from '../db/repo.ts';
import { PAIN_LOCATIONS, RELIEFS, TRIGGERS } from '../logic/catalog.ts';
import { addDays, formatShort, today } from '../logic/dates.ts';
import { findPatterns, MIN_SAMPLES, type Pattern } from '../logic/patterns.ts';
import { Body, Card, Subtitle, Title } from '../ui/components.tsx';
import { colors, painColor, space } from '../ui/theme.ts';

const DAYS = 30;

export function HistorialScreen() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [cpsi, setCpsi] = useState<CpsiEntry[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);

  useEffect(() => {
    (async () => {
      const recent = await listDailyLogs(addDays(today(), -(DAYS - 1)));
      setLogs(recent);
      setCpsi(await listCpsi());
      const all = await listDailyLogs(addDays(today(), -180));
      setPatterns(findPatterns(all, TRIGGERS, RELIEFS));
    })();
  }, []);

  const byDate = new Map(logs.map((l) => [l.date, l]));
  const days = Array.from({ length: DAYS }, (_, i) => addDays(today(), -(DAYS - 1 - i)));
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const last7 = avg(logs.filter((l) => l.date > addDays(today(), -7)).map((l) => l.pain));
  const prev7 = avg(logs.filter((l) => l.date <= addDays(today(), -7) && l.date > addDays(today(), -14)).map((l) => l.pain));

  const locationCounts = PAIN_LOCATIONS
    .map((p) => ({ label: p.label, n: logs.filter((l) => l.locations.includes(p.id)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);

  const cpsiChrono = [...cpsi].reverse().slice(-10);

  return (
    <View>
      <Title>Mi evolución</Title>

      <Card>
        <Subtitle>Dolor de los últimos {DAYS} días</Subtitle>
        <View style={styles.chart} accessibilityLabel="Gráfico de dolor diario">
          {days.map((d) => {
            const l = byDate.get(d);
            return (
              <View key={d} style={styles.barSlot}>
                {l ? (
                  <View style={[styles.bar, { height: 8 + l.pain * 10, backgroundColor: painColor(l.pain) }]} />
                ) : (
                  <View style={styles.noData} />
                )}
              </View>
            );
          })}
        </View>
        <View style={styles.axis}>
          <Text style={styles.axisText}>{formatShort(days[0])}</Text>
          <Text style={styles.axisText}>Hoy</Text>
        </View>
        <View style={{ height: space.sm }} />
        {last7 !== null ? (
          <Body>
            Promedio últimos 7 días: <Text style={styles.strong}>{last7.toFixed(1)}</Text>
            {prev7 !== null && ` (semana anterior: ${prev7.toFixed(1)})`}
          </Body>
        ) : (
          <Body muted>Registra tu dolor en la pestaña Hoy para ver tu gráfico.</Body>
        )}
        <Body muted>Días registrados: {logs.length} de {DAYS}</Body>
      </Card>

      {locationCounts.length > 0 && (
        <Card>
          <Subtitle>Dónde te duele más seguido</Subtitle>
          {locationCounts.map((x) => (
            <Body key={x.label}>• {x.label}: {x.n} días</Body>
          ))}
        </Card>
      )}

      <Card>
        <Subtitle>Tus patrones</Subtitle>
        {patterns.length === 0 ? (
          <Body muted>
            Aún no hay suficientes datos. Cuando registres varios días (cada detonante o alivio debe aparecer al menos
            {' '}{MIN_SAMPLES} veces y faltar otras {MIN_SAMPLES}), aquí verás qué se asocia con más o menos dolor al día siguiente.
          </Body>
        ) : (
          <>
            {patterns.map((p) => (
              <View key={`${p.kind}-${p.id}`} style={styles.pattern}>
                <Text style={[styles.patternTitle, { color: p.kind === 'detonante' ? colors.danger : colors.ok }]}>
                  {p.kind === 'detonante' ? '▲' : '▼'} {p.label}
                </Text>
                <Body>
                  {p.kind === 'detonante'
                    ? `Al día siguiente de "${p.label}", tu dolor promedio fue ${p.withAvg.toFixed(1)} frente a ${p.withoutAvg.toFixed(1)} cuando no hubo.`
                    : `Al día siguiente de "${p.label}", tu dolor promedio fue ${p.withAvg.toFixed(1)} frente a ${p.withoutAvg.toFixed(1)} cuando no lo hiciste.`}
                </Body>
                <Text style={styles.sample}>Basado en {p.withCount} y {p.withoutCount} días.</Text>
              </View>
            ))}
            <Body muted>Son asociaciones en tus propios datos, no pruebas. Úsalas para hacer pruebas: por ejemplo, deja el café 2 semanas y mira si cambia.</Body>
          </>
        )}
      </Card>

      <Card>
        <Subtitle>Controles NIH-CPSI</Subtitle>
        {cpsiChrono.length === 0 ? (
          <Body muted>Haz tu primer control en la pestaña Control.</Body>
        ) : (
          <>
            <View style={styles.chart}>
              {cpsiChrono.map((c) => (
                <View key={c.id} style={styles.cpsiSlot}>
                  <Text style={styles.cpsiValue}>{c.total}</Text>
                  <View style={[styles.cpsiBar, { height: 8 + c.total * 2.4 }]} />
                </View>
              ))}
            </View>
            <View style={styles.axis}>
              <Text style={styles.axisText}>{formatShort(cpsiChrono[0].date)}</Text>
              <Text style={styles.axisText}>{formatShort(cpsiChrono[cpsiChrono.length - 1].date)}</Text>
            </View>
            <Body muted>Puntaje total (0–43). Más bajo es mejor. Bajar 6 puntos o más es una mejoría importante.</Body>
          </>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 130, gap: 2, marginTop: space.sm },
  barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: { width: '100%', borderRadius: 3 },
  noData: { width: '100%', height: 3, backgroundColor: colors.border, borderRadius: 2 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  axisText: { fontSize: 12, color: colors.muted },
  strong: { fontWeight: '700' },
  pattern: { paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: space.sm },
  patternTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  sample: { fontSize: 12, color: colors.muted, marginTop: 2 },
  cpsiSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  cpsiValue: { fontSize: 11, color: colors.muted, marginBottom: 2 },
  cpsiBar: { width: '70%', backgroundColor: colors.primary, borderRadius: 3 },
});

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { listDayEntries, listQuestionnaires, type DayEntries, type QuestionnaireEntry } from '../db/repo.ts';
import { describeCycle, summarizeCycle } from '../logic/ciclo.ts';
import { addDays, formatShort, today } from '../logic/dates.ts';
import { compareSameDay, findPatterns, MIN_SAMPLES, type DayRecord, type Pattern } from '../logic/patterns.ts';
import { questionnaireFor } from '../logic/questionnaires.ts';
import { GENERAL_RELIEFS, GENERAL_TRIGGERS, modulesFor } from '../modules/index.ts';
import type { ConditionId, ModuleDef } from '../modules/types.ts';
import { Body, Card, Subtitle, Title } from '../ui/components.tsx';
import { colors, painColor, space } from '../ui/theme.ts';

const DAYS = 30;
type Row = { date: string; entries: DayEntries };

const list = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function HistorialScreen({ profile }: { profile: ConditionId[] }) {
  const modules = modulesFor(profile);
  const [rows, setRows] = useState<Row[]>([]);
  const [longRows, setLongRows] = useState<Row[]>([]);
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireEntry[]>([]);

  useEffect(() => {
    (async () => {
      const long = await listDayEntries(addDays(today(), -365));
      setLongRows(long);
      setRows(long.filter((r) => r.date >= addDays(today(), -(DAYS - 1))));
      setQuestionnaires(await listQuestionnaires());
    })();
  }, []);

  return (
    <View>
      <Title>Mi evolución</Title>
      {modules.length === 0 && (
        <Card><Body muted>Agrega tus condiciones en Ajustes → Mi perfil para ver tu evolución.</Body></Card>
      )}
      {modules.map((m) => (
        <ModuleHistory key={m.id} module={m} rows={rows} longRows={longRows} />
      ))}
      {modules.map((m) => {
        const def = m.questionnaire ? questionnaireFor(m.questionnaire) : undefined;
        if (!def) return null;
        const items = questionnaires.filter((q) => q.code === def.code).reverse().slice(-10);
        return (
          <Card key={def.code}>
            <Subtitle>Controles {def.name}</Subtitle>
            {items.length === 0 ? (
              <Body muted>Haz tu primer control en la pestaña Control.</Body>
            ) : (
              <>
                <View style={styles.chart}>
                  {items.map((c) => (
                    <View key={c.id} style={styles.slot}>
                      <Text style={styles.value}>{c.total}</Text>
                      <View style={[styles.qBar, { height: 8 + (c.total / def.maxTotal) * 100 }]} />
                    </View>
                  ))}
                </View>
                <View style={styles.axis}>
                  <Text style={styles.axisText}>{formatShort(items[0].date)}</Text>
                  <Text style={styles.axisText}>{formatShort(items[items.length - 1].date)}</Text>
                </View>
                <Body muted>Puntaje total (0–{def.maxTotal}). Más bajo es mejor. {def.source}</Body>
              </>
            )}
          </Card>
        );
      })}
    </View>
  );
}

function ModuleHistory({ module: m, rows, longRows }: { module: ModuleDef; rows: Row[]; longRows: Row[] }) {
  const byDate = new Map(rows.map((r) => [r.date, r.entries]));
  const days = Array.from({ length: DAYS }, (_, i) => addDays(today(), -(DAYS - 1 - i)));
  const valueOn = (e: DayEntries | undefined) => {
    const v = e?.[m.id]?.[m.main.id];
    return typeof v === 'number' ? v : null;
  };
  const withValue = rows.filter((r) => valueOn(r.entries) !== null);
  const last7 = avg(withValue.filter((r) => r.date > addDays(today(), -7)).map((r) => valueOn(r.entries)!));
  const prev7 = avg(withValue
    .filter((r) => r.date <= addDays(today(), -7) && r.date > addDays(today(), -14))
    .map((r) => valueOn(r.entries)!));

  // Zonas más frecuentes (si el módulo tiene "¿Dónde?").
  const zonasField = [...m.fields, ...m.details].find((f) => f.id === 'zonas' && f.kind === 'chips');
  const zonas = zonasField && zonasField.kind === 'chips'
    ? zonasField.items
      .map((i) => ({ label: i.label, n: rows.filter((r) => list(r.entries[m.id]?.zonas).includes(i.id)).length }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
    : [];

  // Patrones: detonantes y alivios del día frente al valor del día siguiente.
  const records: DayRecord[] = longRows
    .filter((r) => valueOn(r.entries) !== null)
    .map((r) => ({
      date: r.date,
      pain: valueOn(r.entries)!,
      triggers: list(r.entries.general?.triggers),
      reliefs: list(r.entries.general?.reliefs),
    }));
  const patterns: Pattern[] = findPatterns(
    records,
    [...GENERAL_TRIGGERS, ...m.triggers],
    [...GENERAL_RELIEFS, ...m.reliefs],
  );

  return (
    <Card>
      <Subtitle>{m.emoji} {m.main.short} · últimos {DAYS} días</Subtitle>
      <View style={styles.chart} accessibilityLabel={`Gráfico de ${m.main.short}`}>
        {days.map((d) => {
          const v = valueOn(byDate.get(d));
          return (
            <View key={d} style={styles.slot}>
              {v !== null
                ? <View style={[styles.bar, { height: 8 + v * 10, backgroundColor: painColor(v) }]} />
                : <View style={styles.noData} />}
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
        <Body muted>Registra en la pestaña Hoy para ver tu gráfico.</Body>
      )}
      <Body muted>Días registrados: {withValue.length} de {DAYS}</Body>

      {zonas.length > 0 && (
        <>
          <Text style={styles.section}>Dónde, con más frecuencia</Text>
          {zonas.map((z) => <Body key={z.label}>• {z.label}: {z.n} días</Body>)}
        </>
      )}

      {m.id === 'sop' && <CycleSection rows={longRows} />}
      {m.id === 'cefalea' && <ScreenSection rows={longRows} />}

      <Text style={styles.section}>Tus patrones</Text>
      {patterns.length === 0 ? (
        <Body muted>
          Aún no hay suficientes datos. Cada detonante o alivio debe aparecer al menos {MIN_SAMPLES} veces y faltar
          otras {MIN_SAMPLES} en días seguidos registrados.
        </Body>
      ) : (
        <>
          {patterns.map((p) => (
            <View key={`${p.kind}-${p.id}`} style={styles.pattern}>
              <Text style={[styles.patternTitle, { color: p.kind === 'detonante' ? colors.danger : colors.ok }]}>
                {p.kind === 'detonante' ? '▲' : '▼'} {p.label}
              </Text>
              <Body>
                Al día siguiente de "{p.label}", tu {m.main.short.toLowerCase()} promedio fue {p.withAvg.toFixed(1)} frente
                a {p.withoutAvg.toFixed(1)} {p.kind === 'detonante' ? 'cuando no hubo' : 'cuando no lo hiciste'}.
              </Body>
              <Text style={styles.sample}>Basado en {p.withCount} y {p.withoutCount} días.</Text>
            </View>
          ))}
          <Body muted>Son asociaciones en tus propios datos, no pruebas. Úsalas para hacer pruebas, por ejemplo dejando algo 2 semanas.</Body>
        </>
      )}
    </Card>
  );
}

function CycleSection({ rows }: { rows: Row[] }) {
  const flow: Record<string, string> = {};
  for (const r of rows) {
    const v = r.entries.sop?.regla;
    if (typeof v === 'string') flow[r.date] = v;
  }
  const lines = describeCycle(summarizeCycle(flow, today()));
  return (
    <>
      <Text style={styles.section}>Tu ciclo</Text>
      {lines.map((l) => <Body key={l}>• {l}</Body>)}
    </>
  );
}

function ScreenSection({ rows }: { rows: Row[] }) {
  const data = rows
    .map((r) => r.entries.cefalea)
    .filter((e): e is NonNullable<typeof e> => !!e && typeof e.intensidad === 'number');
  const laptop = avg(data.map((e) => (typeof e.laptop === 'number' ? e.laptop : 0)));
  const phone = avg(data.map((e) => (typeof e.celular === 'number' ? e.celular : 0)));
  const cmp = compareSameDay(data.map((e) => ({
    value: e.intensidad as number,
    has: typeof e.laptop === 'number' && e.laptop >= 4,
  })));
  return (
    <>
      <Text style={styles.section}>Pantallas</Text>
      {laptop !== null && <Body>Promedio: {laptop.toFixed(1)} h de laptop y {phone?.toFixed(1)} h de celular al día.</Body>}
      {cmp ? (
        <Body>
          Los días con 4 horas o más de laptop, tu dolor de cabeza promedio fue {cmp.withAvg.toFixed(1)}, frente a
          {' '}{cmp.withoutAvg.toFixed(1)} los demás días ({cmp.withCount} y {cmp.withoutCount} días).
        </Body>
      ) : (
        <Body muted>Registra tus horas de pantalla varios días para comparar.</Body>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 130, gap: 2, marginTop: space.sm },
  slot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: { width: '100%', borderRadius: 3 },
  noData: { width: '100%', height: 3, backgroundColor: colors.border, borderRadius: 2 },
  qBar: { width: '70%', backgroundColor: colors.primary, borderRadius: 3 },
  value: { fontSize: 11, color: colors.muted, marginBottom: 2 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  axisText: { fontSize: 12, color: colors.muted },
  strong: { fontWeight: '700' },
  section: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: space.md, marginBottom: space.xs },
  pattern: { paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: space.sm },
  patternTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  sample: { fontSize: 12, color: colors.muted, marginTop: 2 },
});

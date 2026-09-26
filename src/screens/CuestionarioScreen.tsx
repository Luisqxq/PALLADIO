import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { listCpsi, saveCpsi, type CpsiEntry } from '../db/repo.ts';
import { CPSI_QUESTIONS, describeChange, isComplete, scoreCpsi, type CpsiAnswers, type CpsiScore } from '../logic/cpsi.ts';
import { addDays, formatShort, today } from '../logic/dates.ts';
import { Banner, Body, Button, Card, Subtitle, Title } from '../ui/components.tsx';
import { colors, space } from '../ui/theme.ts';

export function CuestionarioScreen() {
  const [answers, setAnswers] = useState<CpsiAnswers>({});
  const [history, setHistory] = useState<CpsiEntry[]>([]);
  const [result, setResult] = useState<{ score: CpsiScore; change: string | null } | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    listCpsi().then(setHistory);
  }, []);

  const last = history[0];
  const due = !last || last.date <= addDays(today(), -7);

  const submit = async () => {
    const score = scoreCpsi(answers);
    await saveCpsi(today(), answers, score);
    setResult({ score, change: last ? describeChange(last.total, score.total) : null });
    setHistory(await listCpsi());
    setAnswers({});
    setStarted(false);
  };

  if (result) {
    const { score, change } = result;
    return (
      <View>
        <Title>Tu resultado</Title>
        <Card>
          <Text style={styles.big}>{score.total} / 43</Text>
          <Body>Dolor: {score.dolor} / 21</Body>
          <Body>Síntomas urinarios: {score.urinario} / 10</Body>
          <Body>Calidad de vida: {score.calidad} / 12</Body>
          <View style={{ height: space.sm }} />
          <Body>Tus síntomas (dolor + urinario) son de intensidad <Text style={{ fontWeight: '700' }}>{score.severidad}</Text>.</Body>
          {change && (
            <>
              <View style={{ height: space.sm }} />
              <Body>{change}</Body>
            </>
          )}
        </Card>
        <Body muted>Este puntaje sirve para seguir tu evolución y mostrárselo a tu médico. No es un diagnóstico.</Body>
        <Button label="Listo" onPress={() => setResult(null)} />
      </View>
    );
  }

  if (!started) {
    return (
      <View>
        <Title>Control semanal</Title>
        <Card>
          <Body>
            El cuestionario NIH-CPSI es el que usan los urólogos para medir la prostatitis crónica. Toma 2 minutos.
            Hazlo una vez por semana para ver con números si mejoras.
          </Body>
        </Card>
        {due ? (
          <Banner kind="info">
            <Body>{last ? 'Ya pasó una semana desde tu último control.' : 'Aún no hiciste tu primer control.'}</Body>
          </Banner>
        ) : (
          <Banner kind="info">
            <Body>Tu último control fue el {formatShort(last.date)}. El próximo, desde el {formatShort(addDays(last.date, 7))}.</Body>
          </Banner>
        )}
        <Button label="Empezar cuestionario" onPress={() => setStarted(true)} />

        {history.length > 0 && (
          <>
            <View style={{ height: space.lg }} />
            <Subtitle>Controles anteriores</Subtitle>
            {history.slice(0, 12).map((h) => (
              <Card key={h.id}>
                <View style={styles.histRow}>
                  <Text style={styles.histDate}>{formatShort(h.date)}</Text>
                  <Text style={styles.histTotal}>{h.total}</Text>
                </View>
                <Body muted>Dolor {h.dolor} · Urinario {h.urinario} · Calidad de vida {h.calidad}</Body>
              </Card>
            ))}
          </>
        )}
      </View>
    );
  }

  return (
    <View>
      <Title>NIH-CPSI</Title>
      <Body muted>Responde pensando en la última semana.</Body>
      <View style={{ height: space.md }} />
      {CPSI_QUESTIONS.map((q, idx) => (
        <Card key={q.id}>
          <Text style={styles.q}>{idx + 1}. {q.text}</Text>
          <View style={q.options.length > 7 ? styles.optionsInline : undefined}>
            {q.options.map((o) => {
              const on = answers[q.id] === o.value;
              return (
                <Pressable
                  key={o.label}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => setAnswers({ ...answers, [q.id]: o.value })}
                  style={[q.options.length > 7 ? styles.optionSmall : styles.option, on && styles.optionOn]}
                >
                  <Text style={[styles.optionText, on && styles.optionTextOn]}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ))}
      <Button label="Ver resultado" disabled={!isComplete(answers)} onPress={submit} />
      <Button kind="secondary" label="Cancelar" onPress={() => { setStarted(false); setAnswers({}); }} />
      {!isComplete(answers) && (
        <Text style={styles.hint}>
          Faltan {CPSI_QUESTIONS.filter((q) => answers[q.id] === undefined).length} respuestas.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  big: { fontSize: 40, fontWeight: '800', color: colors.primary, marginBottom: space.sm },
  q: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: space.sm, lineHeight: 21 },
  option: {
    paddingVertical: 10, paddingHorizontal: space.md, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border, marginTop: 6,
  },
  optionsInline: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optionSmall: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  optionOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontSize: 15, color: colors.text },
  optionTextOn: { color: '#FFFFFF', fontWeight: '600' },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  histDate: { fontSize: 15, fontWeight: '600', color: colors.text },
  histTotal: { fontSize: 22, fontWeight: '800', color: colors.primary },
  hint: { textAlign: 'center', color: colors.muted, marginTop: space.sm },
});

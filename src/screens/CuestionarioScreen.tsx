import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { listQuestionnaires, saveQuestionnaire, type QuestionnaireEntry } from '../db/repo.ts';
import { addDays, formatShort, today } from '../logic/dates.ts';
import {
  isComplete, questionnaireFor, type QAnswers, type QScore, type QuestionnaireDef,
} from '../logic/questionnaires.ts';
import { modulesFor } from '../modules/index.ts';
import type { ConditionId } from '../modules/types.ts';
import { Banner, Body, Button, Card, Subtitle, Title } from '../ui/components.tsx';
import { useScrollToTop } from '../ui/keyboard.tsx';
import { colors, space } from '../ui/theme.ts';

export function CuestionarioScreen({ profile }: { profile: ConditionId[] }) {
  const defs = modulesFor(profile)
    .map((m) => (m.questionnaire ? questionnaireFor(m.questionnaire) : undefined))
    .filter((q): q is QuestionnaireDef => !!q);
  const [history, setHistory] = useState<QuestionnaireEntry[]>([]);
  const [active, setActive] = useState<QuestionnaireDef | null>(null);
  const [answers, setAnswers] = useState<QAnswers>({});
  const [result, setResult] = useState<{ def: QuestionnaireDef; score: QScore; change: string | null } | null>(null);
  const toTop = useScrollToTop();

  useEffect(() => {
    listQuestionnaires().then(setHistory);
  }, []);

  const submit = async () => {
    if (!active) return;
    const score = active.score(answers);
    const last = history.find((h) => h.code === active.code);
    await saveQuestionnaire(active.code, today(), answers, score);
    setResult({ def: active, score, change: last ? active.describeChange(last.total, score.total) : null });
    setHistory(await listQuestionnaires());
    setAnswers({});
    setActive(null);
    toTop();
  };

  if (result) {
    const { def, score, change } = result;
    return (
      <View>
        <Title>Tu resultado · {def.name}</Title>
        <Card>
          <Text style={styles.big}>{score.total} / {def.maxTotal}</Text>
          {score.parts.map((p) => <Body key={p.label}>{p.label}: {p.value} / {p.max}</Body>)}
          <View style={{ height: space.sm }} />
          <Body><Text style={{ fontWeight: '700' }}>{score.severity}.</Text></Body>
          {change && <><View style={{ height: space.sm }} /><Body>{change}</Body></>}
        </Card>
        <Body muted>Este puntaje sirve para seguir tu evolución y mostrárselo a tu médico. No es un diagnóstico.</Body>
        <Button label="Listo" onPress={() => setResult(null)} />
      </View>
    );
  }

  if (active) {
    const missing = active.questions.filter((q) => answers[q.id] === undefined).length;
    return (
      <View>
        <Title>{active.name}</Title>
        <Body muted>{active.intro}</Body>
        <View style={{ height: space.md }} />
        {active.questions.map((q, idx) => (
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
        <Button label="Ver resultado" disabled={!isComplete(active, answers)} onPress={submit} />
        <Button kind="secondary" label="Cancelar" onPress={() => { setActive(null); setAnswers({}); toTop(); }} />
        {missing > 0 && <Text style={styles.hint}>Faltan {missing} respuestas.</Text>}
      </View>
    );
  }

  return (
    <View>
      <Title>Control semanal</Title>
      {defs.length === 0 && (
        <Card>
          <Body muted>
            Tus condiciones no tienen un cuestionario semanal. Tu evolución se ve con el registro diario en la pestaña
            Evolución.
          </Body>
        </Card>
      )}
      {defs.map((def) => {
        const last = history.find((h) => h.code === def.code);
        const due = !last || last.date <= addDays(today(), -7);
        const past = history.filter((h) => h.code === def.code).slice(0, 8);
        return (
          <View key={def.code}>
            <Card>
              <Subtitle>{def.name}</Subtitle>
              <Body>{def.intro}</Body>
              <View style={{ height: space.sm }} />
              <Banner kind="info">
                <Body>
                  {due
                    ? last ? 'Ya pasó una semana desde tu último control.' : 'Aún no hiciste tu primer control.'
                    : `Último control: ${formatShort(last!.date)}. El próximo, desde el ${formatShort(addDays(last!.date, 7))}.`}
                </Body>
              </Banner>
              <Button label={`Empezar ${def.name}`} onPress={() => { setActive(def); setAnswers({}); toTop(); }} />
              <Text style={styles.source}>{def.source}</Text>
            </Card>
            {past.map((h) => (
              <Card key={h.id}>
                <View style={styles.histRow}>
                  <Text style={styles.histDate}>{formatShort(h.date)}</Text>
                  <Text style={styles.histTotal}>{h.total}</Text>
                </View>
                <Body muted>{h.parts.map((p) => `${p.label} ${p.value}`).join(' · ')}</Body>
              </Card>
            ))}
          </View>
        );
      })}
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
    minWidth: 40, height: 40, paddingHorizontal: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  optionOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontSize: 15, color: colors.text },
  optionTextOn: { color: '#FFFFFF', fontWeight: '600' },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  histDate: { fontSize: 15, fontWeight: '600', color: colors.text },
  histTotal: { fontSize: 22, fontWeight: '800', color: colors.primary },
  hint: { textAlign: 'center', color: colors.muted, marginTop: space.sm },
  source: { fontSize: 12, color: colors.muted, marginTop: space.sm },
});

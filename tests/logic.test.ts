/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sustainedHighPain } from '../src/logic/alerts.ts';
import { evaluateFlags, redFlagsFor } from '../src/modules/index.ts';
import { CPSI_QUESTIONS, describeChange, isComplete, scoreCpsi } from '../src/logic/cpsi.ts';
import { addDays, isValidTime, normalizeTime } from '../src/logic/dates.ts';
import { findPatterns, type DayRecord } from '../src/logic/patterns.ts';

const allAt = (pick: (values: number[]) => number) =>
  Object.fromEntries(CPSI_QUESTIONS.map((q) => [q.id, pick(q.options.map((o) => o.value))]));

test('NIH-CPSI: rangos mínimo y máximo oficiales', () => {
  const min = scoreCpsi(allAt((v) => Math.min(...v)));
  assert.deepEqual(
    { dolor: min.dolor, urinario: min.urinario, calidad: min.calidad, total: min.total },
    { dolor: 0, urinario: 0, calidad: 0, total: 0 },
  );
  const max = scoreCpsi(allAt((v) => Math.max(...v)));
  assert.equal(max.dolor, 21);
  assert.equal(max.urinario, 10);
  assert.equal(max.calidad, 12);
  assert.equal(max.sintomas, 31);
  assert.equal(max.total, 43);
  assert.equal(max.severidad, 'severa');
});

test('NIH-CPSI: severidad por puntaje de síntomas', () => {
  const base = allAt((v) => Math.min(...v));
  assert.equal(scoreCpsi({ ...base, q4: 9 }).severidad, 'leve');
  assert.equal(scoreCpsi({ ...base, q4: 10 }).severidad, 'moderada');
  assert.equal(scoreCpsi({ ...base, q4: 10, q3: 5, q5: 4 }).severidad, 'severa'); // 19
});

test('NIH-CPSI: incompleto no se puntúa', () => {
  assert.equal(isComplete({ q1a: 1 }), false);
  assert.throws(() => scoreCpsi({ q1a: 1 }));
});

test('NIH-CPSI: cambio clínicamente importante es de 6 puntos', () => {
  assert.match(describeChange(20, 14), /importante/);
  assert.doesNotMatch(describeChange(20, 15), /importante/);
  assert.match(describeChange(10, 16), /médico/);
});

test('fechas', () => {
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.ok(isValidTime('8:05'));
  assert.ok(!isValidTime('24:00'));
  assert.ok(!isValidTime('08:60'));
  assert.ok(!isValidTime("08:00'); DROP TABLE"));
  assert.equal(normalizeTime('8:05'), '08:05');
});

test('alertas', () => {
  const r = evaluateFlags(['fiebre', 'sangre_orina'], redFlagsFor(['prostatitis']));
  assert.deepEqual(r.urgent.map((f) => f.id), ['fiebre']);
  assert.deepEqual(r.soon.map((f) => f.id), ['sangre_orina']);
  assert.ok(sustainedHighPain([7, 8, 9]));
  assert.ok(!sustainedHighPain([7, 6, 9]));
  assert.ok(!sustainedHighPain([9, 9]));
});

test('patrones: detecta que el café se asocia con más dolor al día siguiente', () => {
  const records: DayRecord[] = [];
  for (let i = 0; i < 14; i++) {
    const coffee = i % 2 === 0;
    const prevCoffee = i > 0 && (i - 1) % 2 === 0;
    records.push({
      date: addDays('2026-03-01', i),
      pain: prevCoffee ? 7 : 3,
      triggers: coffee ? ['cafe'] : [],
      reliefs: [],
    });
  }
  const patterns = findPatterns(records, [{ id: 'cafe', label: 'Café' }, { id: 'alcohol', label: 'Alcohol' }], []);
  assert.equal(patterns.length, 1);
  assert.equal(patterns[0].id, 'cafe');
  assert.equal(patterns[0].kind, 'detonante');
  assert.ok(patterns[0].diff >= 3);
});

test('patrones: sin datos suficientes no inventa nada', () => {
  const records: DayRecord[] = [
    { date: '2026-03-01', pain: 2, triggers: ['cafe'], reliefs: [] },
    { date: '2026-03-02', pain: 9, triggers: [], reliefs: [] },
  ];
  assert.deepEqual(findPatterns(records, [{ id: 'cafe', label: 'Café' }], []), []);
});

test('patrones: días no consecutivos no se emparejan', () => {
  const records: DayRecord[] = [];
  for (let i = 0; i < 10; i++) {
    records.push({ date: addDays('2026-03-01', i * 2), pain: i % 2 ? 9 : 1, triggers: i % 2 ? [] : ['cafe'], reliefs: [] });
  }
  assert.deepEqual(findPatterns(records, [{ id: 'cafe', label: 'Café' }], []), []);
});

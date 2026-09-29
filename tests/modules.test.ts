/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isoWeek, limitsFor, MENUS, menuIndexFor } from '../src/content/alimentacion.ts';
import { habitsFor, precautionsFor } from '../src/content/habitos.ts';
import { REMEDIES } from '../src/content/remedios.ts';
import { recommendations } from '../src/logic/antecedentes.ts';
import { analgesicDays, describeCycle, summarizeCycle } from '../src/logic/ciclo.ts';
import { convertLegacyCpsi, convertLegacyDaily } from '../src/logic/legacy.ts';
import { IBS_SSS, NIH_CPSI, isComplete } from '../src/logic/questionnaires.ts';
import {
  cleanEntry, MODULES, modulesFor, redFlagsFor, reliefsFor, triggersFor,
} from '../src/modules/index.ts';

test('módulos: ids de campos, alarmas y detonantes sin duplicados', () => {
  const flagIds = MODULES.flatMap((m) => m.redFlags.map((f) => f.id));
  assert.equal(new Set(flagIds).size, flagIds.length, 'alarmas duplicadas');
  for (const m of MODULES) {
    const fieldIds = [...m.fields, ...m.details].map((f) => f.id);
    assert.equal(new Set(fieldIds).size, fieldIds.length, `campos duplicados en ${m.id}`);
    assert.equal(m.fields[0].id, m.main.id, `el primer campo de ${m.id} debe ser el principal`);
    assert.equal(m.fields[0].kind, 'scale');
  }
});

test('módulos: el perfil define qué se ve', () => {
  assert.deepEqual(modulesFor(['cefalea', 'prostatitis']).map((m) => m.id), ['prostatitis', 'cefalea']);
  assert.ok(redFlagsFor(['sop']).every((f) => !['fiebre', 'no_orina'].includes(f.id)));
  assert.ok(redFlagsFor(['prostatitis']).some((f) => f.id === 'no_orina'));
  const t = triggersFor(['colon', 'sop']).map((x) => x.id);
  assert.equal(new Set(t).size, t.length, 'detonantes repetidos (harinas/dulces están en colon y sop)');
  assert.ok(reliefsFor([]).length > 0);
});

test('módulos: limpia datos malformados', () => {
  assert.deepEqual(cleanEntry({ a: 1, b: 'x', c: ['y', 2], d: { e: 1 }, f: NaN }), { a: 1, b: 'x', c: ['y'] });
  assert.deepEqual(cleanEntry('texto'), {});
});

test('migración v1: tus registros de prostatitis pasan intactos al nuevo formato', () => {
  const c = convertLegacyDaily({
    date: '2026-09-27', pain: 6, locations: '["perineo"]', urinary: '["ardor"]', nocturia: 2,
    triggers: '["cafe"]', reliefs: '["bano_asiento"]', flags: '[]', notes: 'me dolió', updated_at: 'x',
  });
  assert.deepEqual(c.prostatitis, { dolor: 6, zonas: ['perineo'], orina: ['ardor'], nocturia: 2 });
  assert.deepEqual(c.general, { triggers: ['cafe'], reliefs: ['bano_asiento'], flags: [], notes: 'me dolió' });
  const bad = convertLegacyDaily({ date: 'x', pain: 1, locations: 'no json', urinary: '', nocturia: 0, triggers: '', reliefs: '', flags: '', notes: '', updated_at: '' });
  assert.deepEqual(bad.prostatitis.zonas, []);
  const q = convertLegacyCpsi({ date: '2026-09-20', answers: '{}', dolor: 10, urinario: 4, calidad: 6, total: 20 });
  assert.equal(q.code, 'nih-cpsi');
  assert.equal(JSON.parse(q.parts)[0].value, 10);
});

test('IBS-SSS: puntaje y severidad', () => {
  const zero = { dolor: 0, dias: 0, hinchazon: 0, insatisfaccion: 0, interferencia: 0 };
  assert.equal(IBS_SSS.score(zero).total, 0);
  const s = IBS_SSS.score({ dolor: 50, dias: 5, hinchazon: 40, insatisfaccion: 60, interferencia: 30 });
  assert.equal(s.total, 230);
  assert.match(s.severity, /moderado/);
  assert.match(IBS_SSS.score({ dolor: 100, dias: 10, hinchazon: 100, insatisfaccion: 100, interferencia: 100 }).severity, /severo/);
  assert.match(IBS_SSS.describeChange(300, 240), /importante/);
  assert.ok(!isComplete(IBS_SSS, { dolor: 1 }));
  assert.equal(NIH_CPSI.questions.length, 13);
});

test('ciclo: detecta inicios de regla y duración promedio', () => {
  const flow: Record<string, string> = {
    '2026-06-01': 'moderada', '2026-06-02': 'abundante', '2026-06-03': 'leve',
    '2026-06-20': 'manchado', // no inicia ciclo
    '2026-07-10': 'leve', '2026-07-11': 'moderada',
    '2026-08-19': 'moderada',
  };
  const s = summarizeCycle(flow, '2026-09-28');
  assert.deepEqual(s.periodStarts, ['2026-06-01', '2026-07-10', '2026-08-19']);
  assert.deepEqual(s.cycleLengths, [39, 40]);
  assert.equal(s.averageLength, 40);
  assert.equal(s.daysSinceLastStart, 40);
  assert.ok(describeCycle(s).some((l) => l.includes('35 días')));
  assert.ok(describeCycle(summarizeCycle({}, '2026-09-28'))[0].includes('Registra'));
  assert.ok(describeCycle(summarizeCycle({ '2026-05-01': 'leve' }, '2026-09-28')).some((l) => l.includes('3 meses')));
});

test('analgésicos: cuenta días en los últimos 30', () => {
  const entries = Array.from({ length: 40 }, (_, i) => ({
    date: `2026-09-${String((i % 28) + 1).padStart(2, '0')}`,
    otros: i % 2 === 0 ? ['analgesico'] : [],
  }));
  assert.equal(analgesicDays([{ date: '2026-09-28', otros: ['analgesico'] }, { date: '2026-08-01', otros: ['analgesico'] }], '2026-09-28'), 1);
  assert.ok(analgesicDays(entries, '2026-09-28') > 0);
});

test('antecedentes: la recomendación depende del parentesco', () => {
  const tia = recommendations([{ relative: 'tio', condition: 'diabetes' }]);
  assert.equal(tia[0].closest, 2);
  assert.match(tia[0].text, /35 años/);
  const padre = recommendations([{ relative: 'padre', condition: 'aneurisma' }]);
  assert.equal(padre[0].closest, 1);
  assert.doesNotMatch(padre[0].text, /angiorresonancia/);
  const dos = recommendations([{ relative: 'padre', condition: 'aneurisma' }, { relative: 'hermano', condition: 'aneurisma' }]);
  assert.match(dos[0].text, /angiorresonancia/);
  const orden = recommendations([{ relative: 'primo', condition: 'glaucoma' }, { relative: 'madre', condition: 'hipertension' }]);
  assert.equal(orden[0].condition, 'hipertension');
});

test('menús: cambian cada semana y rotan cada 4', () => {
  assert.equal(MENUS.length, 4);
  assert.ok(MENUS.every((w) => w.length === 7));
  assert.equal(isoWeek('2026-01-01'), 1);
  assert.equal(isoWeek('2026-12-31'), 53);
  assert.notEqual(menuIndexFor('2026-09-28'), menuIndexFor('2026-10-05'));
  assert.equal(menuIndexFor('2026-09-28'), menuIndexFor('2026-09-30')); // misma semana
  assert.ok(MENUS.flat().every((d) => !/rocoto|ají panca|picante\)/i.test(d.almuerzo) || /sin/i.test(d.almuerzo)));
});

test('guía: contenido según el perfil', () => {
  const tuyo = ['prostatitis', 'colon', 'fractura'] as const;
  const ella = ['sop', 'cefalea'] as const;
  const pTuyo = precautionsFor([...tuyo]).map((p) => p.title);
  assert.ok(pTuyo.some((t) => t.includes('Bicicleta')));
  assert.ok(pTuyo.some((t) => t.includes('placas')));
  assert.ok(precautionsFor([...ella]).every((p) => p.when.every((c) => (ella as readonly string[]).includes(c))));
  assert.ok(habitsFor([...ella]).every((h) => h.for === 'todos' || h.for.some((c) => (ella as readonly string[]).includes(c))));
  assert.ok(!habitsFor([...ella]).some((h) => h.title.includes('sentado')));
  assert.ok(limitsFor(['sop']).some((l) => l.name.includes('Dulces')));
  for (const c of ['prostatitis', 'colon', 'fractura', 'sop', 'cefalea'] as const) {
    assert.ok(REMEDIES.some((r) => r.for.includes(c)), `sin remedios para ${c}`);
  }
  const ids = REMEDIES.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'remedios duplicados');
});

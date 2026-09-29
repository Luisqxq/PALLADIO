/// <reference types="node" />
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { test } from 'node:test';
import { BackupError, decryptBackup, encryptBackup } from '../src/logic/backup.ts';
import { validateBackupData } from '../src/logic/backupData.ts';

const random = (n: number) => webcrypto.getRandomValues(new Uint8Array(n));
const PASSWORD = 'mi clave segura 123';

test('respaldo: cifra y descifra con la contraseña correcta', async () => {
  const plain = JSON.stringify({ hola: 'próstata ñandú', n: [1, 2, 3] });
  const file = await encryptBackup(plain, PASSWORD, random);
  assert.ok(!file.includes('próstata'), 'el contenido no debe verse en claro');
  assert.equal(await decryptBackup(file, PASSWORD), plain);
});

test('respaldo: rechaza contraseña incorrecta', async () => {
  const file = await encryptBackup('secreto', PASSWORD, random);
  await assert.rejects(decryptBackup(file, 'otra clave 123'), BackupError);
});

test('respaldo: detecta alteraciones del contenido y de la cabecera', async () => {
  const file = await encryptBackup('secreto', PASSWORD, random);
  const e = JSON.parse(file);
  const flip = (hex: string) => (hex[0] === 'a' ? 'b' : 'a') + hex.slice(1);
  await assert.rejects(decryptBackup(JSON.stringify({ ...e, data: flip(e.data) }), PASSWORD), BackupError);
  await assert.rejects(
    decryptBackup(JSON.stringify({ ...e, cipher: { ...e.cipher, nonce: flip(e.cipher.nonce) } }), PASSWORD),
    BackupError,
  );
  // Parámetros exagerados (para congelar el teléfono) se rechazan antes de derivar.
  await assert.rejects(decryptBackup(JSON.stringify({ ...e, kdf: { ...e.kdf, N: 2 ** 22 } }), PASSWORD), BackupError);
  await assert.rejects(decryptBackup('no es json', PASSWORD), BackupError);
});

test('respaldo: exige contraseña de al menos 8 caracteres', async () => {
  await assert.rejects(encryptBackup('x', '1234567', random), BackupError);
});

test('respaldo: cada archivo usa sal y nonce distintos', async () => {
  const a = JSON.parse(await encryptBackup('igual', PASSWORD, random));
  const b = JSON.parse(await encryptBackup('igual', PASSWORD, random));
  assert.notEqual(a.kdf.salt, b.kdf.salt);
  assert.notEqual(a.cipher.nonce, b.cipher.nonce);
  assert.notEqual(a.data, b.data);
});

const VALID = {
  schema: 3,
  exportedAt: '2026-09-29T10:00:00.000Z',
  settings: [{ key: 'profile', value: '["prostatitis"]' }, { key: 'db_key', value: 'NO' }],
  dayEntries: [{ date: '2026-09-28', module: 'prostatitis', data: '{"dolor":3}', updated_at: 'x' }],
  medications: [{ id: 1, name: 'Tamsulosina', dose: '0.4 mg', times: '["08:00"]', reminders: 1, active: 1, created_at: 'x' }],
  intakes: [{ medication_id: 1, date: '2026-09-28', slot: '08:00', status: 'tomada', recorded_at: 'x' }],
  questionnaires: [{ code: 'nih-cpsi', date: '2026-09-28', answers: '{}', parts: '[]', total: 12 }],
  familyHistory: [{ relative: 'tio', condition: 'diabetes', note: '', created_at: 'x' }],
};

test('datos del respaldo: acepta un respaldo válido y descarta ajustes no permitidos', () => {
  const d = validateBackupData(VALID);
  assert.deepEqual(d.settings.map((s) => s.key), ['profile']);
  assert.equal(d.medications.length, 1);
});

test('datos del respaldo: rechaza datos malformados', () => {
  assert.throws(() => validateBackupData({ ...VALID, schema: 99 }));
  assert.throws(() => validateBackupData({ ...VALID, dayEntries: [{ date: '28/09/2026', module: 'x', data: '{}', updated_at: 'x' }] }));
  assert.throws(() => validateBackupData({ ...VALID, intakes: [{ ...VALID.intakes[0], medication_id: 99 }] }));
  assert.throws(() => validateBackupData({ ...VALID, intakes: [{ ...VALID.intakes[0], status: 'DROP TABLE' }] }));
  assert.throws(() => validateBackupData(null));
});

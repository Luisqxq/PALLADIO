// Base de datos cifrada con SQLCipher (AES-256).
// Todas las consultas usan parámetros: nunca se arma SQL con texto del usuario.

import * as SQLite from 'expo-sqlite';
import { createDbKey, deleteDbKey, getExistingDbKey } from '../security/keys.ts';

const DB_NAME = 'palladio.db';
let db: SQLite.SQLiteDatabase | null = null;

export class DatabaseLockedError extends Error {}

const MIGRATIONS: string[] = [
  // v1
  `
  CREATE TABLE daily_log (
    date TEXT PRIMARY KEY NOT NULL,
    pain INTEGER NOT NULL CHECK (pain BETWEEN 0 AND 10),
    locations TEXT NOT NULL DEFAULT '[]',
    urinary TEXT NOT NULL DEFAULT '[]',
    nocturia INTEGER NOT NULL DEFAULT 0,
    triggers TEXT NOT NULL DEFAULT '[]',
    reliefs TEXT NOT NULL DEFAULT '[]',
    flags TEXT NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
  );
  CREATE TABLE medication (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    dose TEXT NOT NULL DEFAULT '',
    times TEXT NOT NULL DEFAULT '[]',
    reminders INTEGER NOT NULL DEFAULT 1,
    notification_ids TEXT NOT NULL DEFAULT '[]',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
  CREATE TABLE intake (
    medication_id INTEGER NOT NULL REFERENCES medication(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    slot TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('tomada', 'omitida')),
    recorded_at TEXT NOT NULL,
    PRIMARY KEY (medication_id, date, slot)
  );
  CREATE TABLE cpsi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    answers TEXT NOT NULL,
    dolor INTEGER NOT NULL,
    urinario INTEGER NOT NULL,
    calidad INTEGER NOT NULL,
    total INTEGER NOT NULL
  );
  CREATE TABLE setting (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
];

async function applyKey(database: SQLite.SQLiteDatabase, hexKey: string) {
  // Clave cruda de 256 bits en formato SQLCipher: x'…'. hexKey está validado
  // como 64 caracteres hexadecimales, así que no hay forma de inyectar SQL.
  if (!/^[0-9a-f]{64}$/.test(hexKey)) throw new Error('Llave inválida');
  await database.execAsync(`PRAGMA key = "x'${hexKey}'";`);
}

async function assertEncrypted(database: SQLite.SQLiteDatabase) {
  // Si SQLCipher no estuviera incluido en la app, esta consulta devuelve vacío.
  // En ese caso nos negamos a guardar datos sin cifrar.
  const row = await database.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version;');
  if (!row?.cipher_version) throw new Error('El cifrado de la base de datos no está disponible.');
}

async function migrate(database: SQLite.SQLiteDatabase) {
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const next = version + 1;
    await database.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(MIGRATIONS[version]);
      await txn.execAsync(`PRAGMA user_version = ${next};`);
    });
    version = next;
  }
}

async function databaseFileExists(): Promise<boolean> {
  // Abrir sin llave: si el archivo existe y está cifrado, leerlo falla.
  // Usamos una conexión aparte que se cierra enseguida.
  const probe = await SQLite.openDatabaseAsync(DB_NAME, { useNewConnection: true });
  try {
    const row = await probe.getFirstAsync<{ n: number }>('SELECT count(*) AS n FROM sqlite_master;');
    return (row?.n ?? 0) > 0;
  } catch {
    return true; // No se pudo leer: existe y está cifrado.
  } finally {
    await probe.closeAsync();
  }
}

export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  let key = await getExistingDbKey();
  if (!key) {
    if (await databaseFileExists()) {
      // Hay datos pero no llave: no se pueden leer. No los borramos sin permiso.
      throw new DatabaseLockedError('No se encontró la llave de cifrado de tus datos.');
    }
    await SQLite.deleteDatabaseAsync(DB_NAME).catch(() => {});
    key = await createDbKey();
  }
  const database = await SQLite.openDatabaseAsync(DB_NAME, { useNewConnection: true });
  try {
    await applyKey(database, key);
    await assertEncrypted(database);
    await database.getFirstAsync('SELECT count(*) FROM sqlite_master;'); // valida la llave
    await database.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
    await migrate(database);
  } catch (e) {
    await database.closeAsync().catch(() => {});
    throw e;
  }
  db = database;
  return database;
}

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('La base de datos no está abierta');
  return db;
}

// Borra TODO: datos y llave. No se puede deshacer.
export async function wipeEverything(): Promise<void> {
  if (db) {
    await db.closeAsync().catch(() => {});
    db = null;
  }
  await SQLite.deleteDatabaseAsync(DB_NAME).catch(() => {});
  await deleteDbKey();
}

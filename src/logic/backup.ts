// Respaldo cifrado con contraseña.
// - Llave: scrypt(contraseña, sal aleatoria) → 256 bits.
// - Cifrado: AES-256-GCM, que además detecta cualquier alteración del archivo.
// - La cabecera (formato y parámetros) va autenticada como AAD: si alguien la
//   cambia, el archivo se rechaza.

import { gcm } from '@noble/ciphers/aes.js';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

export const BACKUP_FORMAT = 'palladio-health-backup';
export const BACKUP_VERSION = 1;
export const MIN_PASSWORD_LENGTH = 8;

const KDF = { name: 'scrypt', N: 2 ** 15, r: 8, p: 1, dkLen: 32 } as const;

export type RandomBytes = (n: number) => Uint8Array;

type Envelope = {
  format: string;
  version: number;
  kdf: { name: 'scrypt'; N: number; r: number; p: number; dkLen: number; salt: string };
  cipher: { name: 'aes-256-gcm'; nonce: string };
  data: string; // hex
};

export class BackupError extends Error {}

function header(e: Pick<Envelope, 'format' | 'version' | 'kdf' | 'cipher'>): Uint8Array {
  return utf8ToBytes(JSON.stringify([e.format, e.version, e.kdf, e.cipher]));
}

async function deriveKey(password: string, kdf: Envelope['kdf']): Promise<Uint8Array> {
  return scryptAsync(utf8ToBytes(password.normalize('NFKC')), hexToBytes(kdf.salt), {
    N: kdf.N, r: kdf.r, p: kdf.p, dkLen: kdf.dkLen,
  });
}

export async function encryptBackup(plaintext: string, password: string, random: RandomBytes): Promise<string> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new BackupError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
  const kdf = { ...KDF, salt: bytesToHex(random(16)) };
  const cipher = { name: 'aes-256-gcm' as const, nonce: bytesToHex(random(12)) };
  const key = await deriveKey(password, kdf);
  const aad = header({ format: BACKUP_FORMAT, version: BACKUP_VERSION, kdf, cipher });
  const sealed = gcm(key, hexToBytes(cipher.nonce), aad).encrypt(utf8ToBytes(plaintext));
  const envelope: Envelope = { format: BACKUP_FORMAT, version: BACKUP_VERSION, kdf, cipher, data: bytesToHex(sealed) };
  return JSON.stringify(envelope);
}

function isHex(s: unknown, bytes?: number): s is string {
  return typeof s === 'string' && /^[0-9a-f]*$/.test(s) && s.length % 2 === 0 && (bytes === undefined || s.length === bytes * 2);
}

export async function decryptBackup(fileText: string, password: string): Promise<string> {
  let e: Envelope;
  try {
    e = JSON.parse(fileText);
  } catch {
    throw new BackupError('El archivo no es un respaldo de Palladio Health.');
  }
  if (!e || e.format !== BACKUP_FORMAT) throw new BackupError('El archivo no es un respaldo de Palladio Health.');
  if (e.version !== BACKUP_VERSION) throw new BackupError('Este respaldo es de una versión que esta app no reconoce.');
  const k = e.kdf;
  // Parámetros razonables: evita archivos manipulados que congelen el teléfono.
  if (!k || k.name !== 'scrypt' || ![2 ** 14, 2 ** 15, 2 ** 16].includes(k.N) || k.r !== 8 || k.p !== 1 || k.dkLen !== 32 || !isHex(k.salt, 16)) {
    throw new BackupError('El respaldo tiene parámetros no válidos.');
  }
  if (!e.cipher || e.cipher.name !== 'aes-256-gcm' || !isHex(e.cipher.nonce, 12) || !isHex(e.data)) {
    throw new BackupError('El respaldo está dañado.');
  }
  const key = await deriveKey(password, k);
  try {
    const plain = gcm(key, hexToBytes(e.cipher.nonce), header(e)).decrypt(hexToBytes(e.data));
    return new TextDecoder().decode(plain);
  } catch {
    throw new BackupError('Contraseña incorrecta o archivo alterado.');
  }
}

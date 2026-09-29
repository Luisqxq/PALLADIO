// Llave de cifrado de la base de datos.
// Se genera al azar en el primer uso y vive solo en el almacén seguro del
// teléfono (Android Keystore). Nunca se escribe en archivos ni en el código.

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const DB_KEY_NAME = 'palladio.db.key.v1';
const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getExistingDbKey(): Promise<string | null> {
  const key = await SecureStore.getItemAsync(DB_KEY_NAME, STORE_OPTIONS);
  return key && /^[0-9a-f]{64}$/.test(key) ? key : null;
}

export async function createDbKey(): Promise<string> {
  const key = toHex(await Crypto.getRandomBytesAsync(32)); // 256 bits
  await SecureStore.setItemAsync(DB_KEY_NAME, key, STORE_OPTIONS);
  return key;
}

export async function deleteDbKey(): Promise<void> {
  await SecureStore.deleteItemAsync(DB_KEY_NAME, STORE_OPTIONS);
}

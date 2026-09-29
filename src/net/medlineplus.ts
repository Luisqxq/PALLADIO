// Única conexión a internet de la app. Solo se usa si activaste las consultas
// a MedlinePlus en la Guía o en Ajustes.

import { getSetting } from '../db/repo.ts';
import { buildSearchUrl, isAllowedServiceUrl, parseSearchResults, type MedlineTopic } from '../logic/medlineplus.ts';

export const MEDLINE_SETTING = 'medline_enabled';
const TIMEOUT_MS = 15_000;
const MAX_RESPONSE_CHARS = 2_000_000;

export class MedlineDisabledError extends Error {}

export async function isMedlineEnabled(): Promise<boolean> {
  return (await getSetting(MEDLINE_SETTING)) === '1';
}

export async function searchMedlinePlus(term: string): Promise<MedlineTopic[]> {
  if (!(await isMedlineEnabled())) throw new MedlineDisabledError('Las consultas a MedlinePlus están desactivadas.');
  const url = buildSearchUrl(term);
  if (!isAllowedServiceUrl(url)) throw new Error('Destino no permitido.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
      headers: { Accept: 'application/xml' },
      signal: controller.signal,
    });
    // Si hubo una redirección, debe seguir siendo el servicio oficial.
    if (res.url && !isAllowedServiceUrl(res.url)) throw new Error('Respuesta desde un destino no permitido.');
    if (!res.ok) throw new Error(`MedlinePlus respondió con un error (${res.status}).`);
    const text = await res.text();
    if (text.length > MAX_RESPONSE_CHARS) throw new Error('Respuesta demasiado grande.');
    return parseSearchResults(text);
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') throw new Error('MedlinePlus tardó demasiado. Revisa tu conexión.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// Servicio web de MedlinePlus (Biblioteca Nacional de Medicina de EE. UU.),
// temas de salud en español: https://medlineplus.gov/about/developers/webservices/
// Solo se envía el término de búsqueda. La respuesta (XML) se convierte a texto
// plano: nunca se ejecuta ni se muestra como página web.

export const MEDLINE_ENDPOINT = 'https://wsearch.nlm.nih.gov/ws/query';
export const MAX_TERM_LENGTH = 80;
export const MAX_RESULTS = 10;

export type MedlineTopic = {
  title: string;
  url: string;
  summary: string; // texto plano
  otherNames: string[];
};

export function normalizeTerm(term: string): string {
  return term.replace(/\s+/g, ' ').trim().slice(0, MAX_TERM_LENGTH);
}

export function buildSearchUrl(term: string): string {
  const t = normalizeTerm(term);
  if (!t) throw new Error('Escribe un tema para buscar.');
  const params = `db=healthTopicsSpanish&term=${encodeURIComponent(t)}&retmax=${MAX_RESULTS}`;
  return `${MEDLINE_ENDPOINT}?${params}`;
}

// Solo se abren enlaces https de medlineplus.gov.
export function isAllowedTopicUrl(url: string): boolean {
  const m = /^https:\/\/([a-z0-9.-]+)(\/[^\s]*)?$/i.exec(url);
  if (!m) return false;
  const host = m[1].toLowerCase();
  return host === 'medlineplus.gov' || host.endsWith('.medlineplus.gov');
}

// El servicio solo debe responder desde su propio dominio.
export function isAllowedServiceUrl(url: string): boolean {
  return url.startsWith('https://wsearch.nlm.nih.gov/');
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', Uuml: 'Ü', iquest: '¿', iexcl: '¡',
  ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', deg: '°', middot: '·',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
    }
    return NAMED_ENTITIES[code] ?? whole;
  });
}

// Convierte el HTML del resumen en texto plano legible.
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|ul|ol|h\d)>/gi, '\n\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parseSearchResults(xml: string): MedlineTopic[] {
  const topics: MedlineTopic[] = [];
  const docRe = /<document\b([^>]*)>([\s\S]*?)<\/document>/g;
  let doc: RegExpExecArray | null;
  while ((doc = docRe.exec(xml)) && topics.length < MAX_RESULTS) {
    const url = decodeEntities(/\burl="([^"]*)"/.exec(doc[1])?.[1] ?? '');
    if (!isAllowedTopicUrl(url)) continue;

    const contents: { name: string; value: string }[] = [];
    const cRe = /<content\b[^>]*\bname="([^"]*)"[^>]*>([\s\S]*?)<\/content>/g;
    let c: RegExpExecArray | null;
    while ((c = cRe.exec(doc[2]))) {
      // El contenido viene como HTML escapado dentro del XML.
      contents.push({ name: c[1], value: decodeEntities(c[2]) });
    }
    const first = (name: string) => contents.find((x) => x.name === name)?.value ?? '';

    const title = htmlToText(first('title'));
    if (!title) continue;
    topics.push({
      title,
      url,
      summary: htmlToText(first('FullSummary') || first('snippet')),
      otherNames: contents.filter((x) => x.name === 'altTitle').map((x) => htmlToText(x.value)).filter(Boolean),
    });
  }
  return topics;
}

// Temas sugeridos para empezar.
export const SUGGESTED_TOPICS = [
  'Prostatitis',
  'Enfermedades de la próstata',
  'Síndrome del intestino irritable',
  'Fibra dietética',
  'Plantas medicinales',
  'Dolor pélvico',
];

// Señales de alarma que requieren atención médica.

export type RedFlagId =
  | 'fiebre'
  | 'no_orina'
  | 'sangre_orina'
  | 'sangre_semen'
  | 'sangre_heces'
  | 'dolor_testicular_subito';

export type RedFlag = { id: RedFlagId; label: string; urgent: boolean; advice: string };

export const RED_FLAGS: RedFlag[] = [
  {
    id: 'fiebre', label: 'Fiebre o escalofríos', urgent: true,
    advice: 'Fiebre con dolor pélvico o al orinar puede ser una prostatitis bacteriana aguda. Acude hoy a emergencia.',
  },
  {
    id: 'no_orina', label: 'No puedo orinar', urgent: true,
    advice: 'La retención de orina es una urgencia. Acude a emergencia de inmediato.',
  },
  {
    id: 'dolor_testicular_subito', label: 'Dolor testicular fuerte y repentino', urgent: true,
    advice: 'Un dolor testicular súbito e intenso puede ser una torsión. Es una urgencia: acude de inmediato.',
  },
  {
    id: 'sangre_orina', label: 'Sangre en la orina', urgent: false,
    advice: 'Pide una cita con tu médico o urólogo en los próximos días. Si es abundante o con coágulos, acude a emergencia.',
  },
  {
    id: 'sangre_semen', label: 'Sangre en el semen', urgent: false,
    advice: 'Suele no ser grave, pero debe revisarlo tu urólogo.',
  },
  {
    id: 'sangre_heces', label: 'Sangre en las heces', urgent: false,
    advice: 'Consulta con tu médico. Si es abundante, o hay mareo o debilidad, acude a emergencia.',
  },
];

export function evaluateFlags(ids: string[]): { urgent: RedFlag[]; soon: RedFlag[] } {
  const selected = RED_FLAGS.filter((f) => ids.includes(f.id));
  return { urgent: selected.filter((f) => f.urgent), soon: selected.filter((f) => !f.urgent) };
}

// Aviso por empeoramiento sostenido: dolor ≥ 7 durante 3 días seguidos.
export function sustainedHighPain(recentPainsNewestFirst: number[]): boolean {
  return recentPainsNewestFirst.length >= 3 && recentPainsNewestFirst.slice(0, 3).every((p) => p >= 7);
}

export const EMERGENCIAS_PERU = [
  { label: 'SAMU (ambulancia)', phone: '106' },
  { label: 'Infosalud MINSA', phone: '113' },
];

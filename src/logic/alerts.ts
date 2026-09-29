// Alertas generales. Las señales de alarma de cada condición están en su
// módulo (src/modules/).

// Aviso por empeoramiento sostenido: 7 o más durante 3 días seguidos.
export function sustainedHighPain(recentValuesNewestFirst: number[]): boolean {
  return recentValuesNewestFirst.length >= 3 && recentValuesNewestFirst.slice(0, 3).every((p) => p >= 7);
}

export const EMERGENCIAS_PERU = [
  { label: 'SAMU (ambulancia)', phone: '106' },
  { label: 'Infosalud MINSA', phone: '113' },
];

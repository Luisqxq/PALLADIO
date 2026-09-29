export const colors = {
  bg: '#F4F7F5',
  card: '#FFFFFF',
  text: '#1C2B24',
  muted: '#5E6E66',
  border: '#DCE5E0',
  primary: '#2F6B55',
  primarySoft: '#E3F1EA',
  warn: '#A15C00',
  warnSoft: '#FFF3E0',
  danger: '#B3261E',
  dangerSoft: '#FDECEA',
  ok: '#2E7D32',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

// Colores de 0 (sin dolor) a 10 (máximo).
export function painColor(v: number): string {
  if (v <= 2) return '#4E9F75';
  if (v <= 4) return '#9DB84A';
  if (v <= 6) return '#E0A526';
  if (v <= 8) return '#E0702B';
  return '#C8372D';
}

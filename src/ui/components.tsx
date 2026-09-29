import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, painColor, space } from './theme.ts';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[styles.body, muted && { color: colors.muted }]}>{children}</Text>;
}

export function Button({
  label, onPress, kind = 'primary', disabled,
}: { label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'danger'; disabled?: boolean }) {
  const bg = kind === 'primary' ? colors.primary : kind === 'danger' ? colors.danger : colors.card;
  const fg = kind === 'secondary' ? colors.primary : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        kind === 'secondary' && { borderWidth: 1, borderColor: colors.primary },
      ]}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function ChipGroup({
  items, selected, onToggle,
}: { items: { id: string; label: string }[]; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <View style={styles.chipGroup}>
      {items.map((i) => (
        <Chip key={i.id} label={i.label} selected={selected.includes(i.id)} onPress={() => onToggle(i.id)} />
      ))}
    </View>
  );
}

// Selector 0–10 con colores.
export function ScaleSelector({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <View style={styles.scale}>
      {Array.from({ length: 11 }, (_, i) => {
        const on = value === i;
        return (
          <Pressable
            key={i}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`Dolor ${i}`}
            onPress={() => onChange(i)}
            style={[styles.scaleItem, { borderColor: painColor(i) }, on && { backgroundColor: painColor(i) }]}
          >
            <Text style={[styles.scaleText, on && { color: '#FFFFFF' }]}>{i}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({ value, onChange, min = 0, max = 10, unit }: { value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string }) {
  return (
    <View style={styles.stepper}>
      <Pressable accessibilityLabel="Menos" onPress={() => onChange(Math.max(min, value - 1))} style={styles.stepBtn}>
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{value}{unit ? ` ${unit}` : ''}</Text>
      <Pressable accessibilityLabel="Más" onPress={() => onChange(Math.min(max, value + 1))} style={styles.stepBtn}>
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

export function Banner({ kind, children }: { kind: 'warn' | 'danger' | 'info'; children: ReactNode }) {
  const bg = kind === 'danger' ? colors.dangerSoft : kind === 'warn' ? colors.warnSoft : colors.primarySoft;
  const border = kind === 'danger' ? colors.danger : kind === 'warn' ? colors.warn : colors.primary;
  return <View style={[styles.banner, { backgroundColor: bg, borderLeftColor: border }]}>{children}</View>;
}

export function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 14, padding: space.lg,
    marginBottom: space.md, borderWidth: 1, borderColor: colors.border,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: space.sm },
  subtitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: space.sm },
  body: { fontSize: 15, lineHeight: 22, color: colors.text },
  button: { paddingVertical: 12, paddingHorizontal: space.lg, borderRadius: 10, alignItems: 'center', marginTop: space.sm },
  buttonText: { fontSize: 16, fontWeight: '600' },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.text },
  chipTextOn: { color: '#FFFFFF', fontWeight: '600' },
  scale: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  scaleItem: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card,
  },
  scaleText: { fontSize: 15, fontWeight: '700', color: colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  stepValue: { fontSize: 20, fontWeight: '700', color: colors.text, minWidth: 30, textAlign: 'center' },
  banner: { borderLeftWidth: 4, borderRadius: 8, padding: space.md, marginBottom: space.md },
  badge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: space.sm },
  badgeText: { fontSize: 12, fontWeight: '700' },
});

// Selección de una sola opción, con chips.
export function SingleGroup({
  items, value, onChange,
}: { items: { id: string; label: string }[]; value: string | undefined; onChange: (id: string | undefined) => void }) {
  return (
    <View style={styles.chipGroup}>
      {items.map((i) => (
        <Chip key={i.id} label={i.label} selected={value === i.id} onPress={() => onChange(value === i.id ? undefined : i.id)} />
      ))}
    </View>
  );
}

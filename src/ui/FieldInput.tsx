import { StyleSheet, Text, View } from 'react-native';
import type { EntryValue, Field } from '../modules/types.ts';
import { ChipGroup, ScaleSelector, SingleGroup, Stepper } from './components.tsx';
import { colors, space } from './theme.ts';

type Props = { field: Field; value: EntryValue | undefined; onChange: (v: EntryValue | undefined) => void };

export function FieldInput({ field, value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{field.label}</Text>
      {field.kind === 'scale' && field.hint && <Text style={styles.hint}>{field.hint}</Text>}
      {field.kind === 'scale' && (
        <ScaleSelector value={typeof value === 'number' ? value : null} onChange={onChange} />
      )}
      {field.kind === 'chips' && (
        <ChipGroup
          items={field.items}
          selected={Array.isArray(value) ? value : []}
          onToggle={(id) => {
            const list = Array.isArray(value) ? value : [];
            onChange(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
          }}
        />
      )}
      {field.kind === 'single' && (
        <SingleGroup items={field.items} value={typeof value === 'string' ? value : undefined} onChange={onChange} />
      )}
      {field.kind === 'stepper' && (
        <Stepper
          value={typeof value === 'number' ? value : field.min}
          min={field.min}
          max={field.max}
          unit={field.unit}
          onChange={onChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md },
  label: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: space.sm },
  hint: { fontSize: 13, color: colors.muted, marginTop: -4, marginBottom: space.sm },
});

// Elegir las condiciones del perfil (primer uso y Ajustes → Mi perfil).

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MODULES } from '../modules/index.ts';
import type { ConditionId } from '../modules/types.ts';
import { Body, Button } from '../ui/components.tsx';
import { colors, space } from '../ui/theme.ts';

type Props = { initial: ConditionId[]; saveLabel: string; onSave: (conditions: ConditionId[]) => void | Promise<void> };

export function PerfilPicker({ initial, saveLabel, onSave }: Props) {
  const [selected, setSelected] = useState<ConditionId[]>(initial);
  const toggle = (id: ConditionId) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <View>
      {MODULES.map((m) => {
        const on = selected.includes(m.id);
        return (
          <Pressable
            key={m.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            onPress={() => toggle(m.id)}
            style={[styles.item, on && styles.itemOn]}
          >
            <Text style={styles.check}>{on ? '☑' : '☐'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{m.emoji} {m.name}</Text>
              <Text style={styles.desc}>{m.description}</Text>
            </View>
          </Pressable>
        );
      })}
      <Body muted>
        Solo verás el registro, la guía y las alertas de lo que marques. Puedes cambiarlo cuando quieras en Ajustes.
        Tus datos de cada condición se conservan aunque la desmarques.
      </Body>
      <Button label={saveLabel} onPress={() => onSave(selected)} />
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row', gap: space.md, alignItems: 'flex-start', padding: space.md, marginBottom: space.sm,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  itemOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  check: { fontSize: 22, color: colors.primary },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  desc: { fontSize: 14, color: colors.muted, marginTop: 2 },
});

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { addFamilyHistory, listFamilyHistory, removeFamilyHistory, type FamilyHistoryItem } from '../db/repo.ts';
import { FAMILY_CONDITIONS, RELATIVES } from '../logic/antecedentes.ts';
import { Body, Button, Card, SingleGroup, Subtitle } from '../ui/components.tsx';
import { Input } from '../ui/keyboard.tsx';
import { colors, space } from '../ui/theme.ts';

const labelOf = (list: { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? id;

export function AntecedentesSection() {
  const [items, setItems] = useState<FamilyHistoryItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [relative, setRelative] = useState<string | undefined>();
  const [condition, setCondition] = useState<string | undefined>();
  const [note, setNote] = useState('');

  const load = () => listFamilyHistory().then(setItems);
  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!relative || !condition) return;
    await addFamilyHistory(relative, condition, note);
    setAdding(false); setRelative(undefined); setCondition(undefined); setNote('');
    load();
  };

  return (
    <Card>
      <Subtitle>🧬 Antecedentes familiares</Subtitle>
      <Body muted>Enfermedades de tu familia. Sirven para recomendarte controles preventivos (Guía → Prevención).</Body>
      {items.map((i) => (
        <View key={i.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.item}>{labelOf(FAMILY_CONDITIONS, i.condition)}</Text>
            <Text style={styles.sub}>{labelOf(RELATIVES, i.relative)}{i.note ? ` · ${i.note}` : ''}</Text>
          </View>
          <Text accessibilityRole="button" style={styles.remove} onPress={async () => { await removeFamilyHistory(i.id); load(); }}>
            Quitar
          </Text>
        </View>
      ))}
      {adding ? (
        <View style={{ marginTop: space.md }}>
          <Text style={styles.label}>¿Quién?</Text>
          <SingleGroup items={RELATIVES} value={relative} onChange={setRelative} />
          <Text style={styles.label}>¿Qué enfermedad?</Text>
          <SingleGroup items={FAMILY_CONDITIONS} value={condition} onChange={setCondition} />
          <Text style={styles.label}>Nota (opcional)</Text>
          <Input
            style={styles.input}
            value={note}
            onChangeText={setNote}
            maxLength={200}
            placeholder="Ej. le diagnosticaron a los 50 años"
            placeholderTextColor={colors.muted}
          />
          <Button label="Agregar" disabled={!relative || !condition} onPress={add} />
          <Button kind="secondary" label="Cancelar" onPress={() => setAdding(false)} />
        </View>
      ) : (
        <Button kind="secondary" label="+ Agregar antecedente" onPress={() => setAdding(true)} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.sm, borderTopWidth: 1, borderTopColor: colors.border, marginTop: space.sm },
  item: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 13, color: colors.muted },
  remove: { color: colors.danger, fontWeight: '600', padding: space.sm },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: space.md, marginBottom: space.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: space.md, fontSize: 15, color: colors.text },
});

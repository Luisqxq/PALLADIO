import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import {
  addMedication, archiveMedication, listIntakes, listMedications, setNotificationIds,
  type Intake, type Medication,
} from '../db/repo.ts';
import { addDays, isValidTime, normalizeTime, today } from '../logic/dates.ts';
import { cancelReminders, ensurePermission, scheduleDailyReminders } from '../notifications.ts';
import { withSystemDialog } from '../security/LockGate.tsx';
import { Banner, Body, Button, Card, Subtitle, Title } from '../ui/components.tsx';
import { colors, space } from '../ui/theme.ts';

export function MedicamentosScreen() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [times, setTimes] = useState<string[]>([]);
  const [timeInput, setTimeInput] = useState('');
  const [reminders, setReminders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setMeds(await listMedications());
    setIntakes(await listIntakes(addDays(today(), -6)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addTime = () => {
    if (!isValidTime(timeInput)) {
      setError('Escribe la hora en formato 24 horas, por ejemplo 08:00 o 20:30.');
      return;
    }
    const t = normalizeTime(timeInput);
    if (!times.includes(t)) setTimes([...times, t].sort());
    setTimeInput('');
    setError(null);
  };

  const reset = () => {
    setAdding(false); setName(''); setDose(''); setTimes([]); setTimeInput(''); setReminders(true); setError(null);
  };

  const save = async () => {
    if (!name.trim()) {
      setError('Escribe el nombre del medicamento.');
      return;
    }
    const id = await addMedication({ name, dose, times, reminders });
    setNotice(null);
    if (reminders && times.length > 0) {
      const granted = await withSystemDialog(ensurePermission);
      if (granted) {
        await setNotificationIds(id, await scheduleDailyReminders(times));
      } else {
        setNotice('No diste permiso para notificaciones, así que no habrá recordatorios. Puedes activarlo en Ajustes del teléfono > Apps > Palladio Health > Notificaciones.');
      }
    }
    reset();
    load();
  };

  const remove = (m: Medication) => {
    Alert.alert(
      `¿Quitar ${m.name}?`,
      'Se cancelarán sus recordatorios. El historial de tomas se conserva.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar', style: 'destructive',
          onPress: async () => {
            await cancelReminders(m.notificationIds);
            await archiveMedication(m.id);
            load();
          },
        },
      ],
    );
  };

  // Cumplimiento de los últimos 7 días (sobre las tomas programadas).
  const adherence = (m: Medication) => {
    if (m.times.length === 0) return null;
    const taken = intakes.filter((i) => i.medicationId === m.id && i.status === 'tomada').length;
    const created = new Date(m.createdAt);
    const createdDay = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const daysSince = Math.floor((Date.now() - createdDay.getTime()) / 86_400_000) + 1;
    const expected = m.times.length * Math.max(1, Math.min(7, daysSince));
    return Math.min(100, Math.round((taken / expected) * 100));
  };

  return (
    <View>
      <Title>Medicamentos</Title>
      <Body muted>Registra tus pastillas y suplementos. Márcalos como tomados en la pestaña Hoy.</Body>
      <View style={{ height: space.md }} />

      {notice && (
        <Banner kind="warn">
          <Body>{notice}</Body>
        </Banner>
      )}

      {meds.map((m) => {
        const pct = adherence(m);
        return (
          <Card key={m.id}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Subtitle>{m.name}</Subtitle>
                {!!m.dose && <Body muted>{m.dose}</Body>}
                <Body muted>
                  {m.times.length ? `Horario: ${m.times.join(', ')}` : 'Sin horario fijo'}
                  {m.reminders && m.times.length ? ' · 🔔' : ''}
                </Body>
                {pct !== null && <Text style={styles.adherence}>Últimos 7 días: {pct}% de tomas</Text>}
              </View>
              <Text accessibilityRole="button" onPress={() => remove(m)} style={styles.remove}>Quitar</Text>
            </View>
          </Card>
        );
      })}

      {meds.length === 0 && !adding && (
        <Card>
          <Body muted>Aún no registraste medicamentos.</Body>
        </Card>
      )}

      {adding ? (
        <Card>
          <Subtitle>Nuevo medicamento</Subtitle>
          <TextInput style={styles.input} placeholder="Nombre (ej. Tamsulosina)" placeholderTextColor={colors.muted} value={name} onChangeText={setName} maxLength={100} />
          <TextInput style={styles.input} placeholder="Dosis (ej. 0.4 mg, 1 cápsula)" placeholderTextColor={colors.muted} value={dose} onChangeText={setDose} maxLength={100} />
          <Body>Horarios</Body>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="HH:MM (ej. 08:00)"
              placeholderTextColor={colors.muted}
              value={timeInput}
              onChangeText={setTimeInput}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
            <Button kind="secondary" label="Añadir" onPress={addTime} />
          </View>
          <View style={styles.times}>
            {times.map((t) => (
              <Text key={t} style={styles.time} onPress={() => setTimes(times.filter((x) => x !== t))}>
                {t} ✕
              </Text>
            ))}
          </View>
          <View style={[styles.row, { marginTop: space.md }]}>
            <Body>Recordatorios</Body>
            <Switch value={reminders} onValueChange={setReminders} trackColor={{ true: colors.primary }} />
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label="Guardar" onPress={save} />
          <Button kind="secondary" label="Cancelar" onPress={reset} />
        </Card>
      ) : (
        <Button label="+ Añadir medicamento" onPress={() => setAdding(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: space.md,
    fontSize: 15, color: colors.text, marginBottom: space.sm,
  },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  time: {
    backgroundColor: colors.primarySoft, color: colors.primary, fontWeight: '600',
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14, overflow: 'hidden',
  },
  remove: { color: colors.danger, fontWeight: '600', padding: space.sm },
  adherence: { marginTop: space.xs, color: colors.primary, fontWeight: '600' },
  error: { color: colors.danger, marginTop: space.sm },
});

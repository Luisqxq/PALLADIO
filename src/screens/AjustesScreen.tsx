import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { getSetting, setSetting } from '../db/repo.ts';
import { DISCLAIMER } from '../content/habitos.ts';
import { Banner, Body, Button, Card, Chip, Subtitle, Title } from '../ui/components.tsx';
import { colors, space } from '../ui/theme.ts';

export const LOCK_SETTING = 'lock_after_ms';
export const LOCK_OPTIONS = [
  { ms: 0, label: 'Siempre' },
  { ms: 60_000, label: '1 minuto' },
  { ms: 5 * 60_000, label: '5 minutos' },
];

type Props = { onLockChange: (ms: number) => void; onWipe: () => Promise<void> };

export function AjustesScreen({ onLockChange, onWipe }: Props) {
  const [lockMs, setLockMs] = useState<number>(60_000);
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    getSetting(LOCK_SETTING).then((v) => v !== null && setLockMs(Number(v)));
  }, []);

  const chooseLock = async (ms: number) => {
    setLockMs(ms);
    await setSetting(LOCK_SETTING, String(ms));
    onLockChange(ms);
  };

  return (
    <View>
      <Title>Ajustes</Title>

      <Card>
        <Subtitle>Bloqueo de la app</Subtitle>
        <Body muted>Pedir huella o PIN al volver a la app después de:</Body>
        <View style={styles.row}>
          {LOCK_OPTIONS.map((o) => (
            <Chip key={o.ms} label={o.label} selected={lockMs === o.ms} onPress={() => chooseLock(o.ms)} />
          ))}
        </View>
      </Card>

      <Card>
        <Subtitle>Tu privacidad</Subtitle>
        <Body>• Tus datos se guardan solo en este teléfono, cifrados con AES-256.</Body>
        <Body>• Esta versión no tiene permiso de internet: no puede enviar nada a ningún lado.</Body>
        <Body>• No hay cuentas, publicidad ni rastreadores.</Body>
        <Body>• Las capturas de pantalla están bloqueadas dentro de la app.</Body>
        <Body>• Los recordatorios no muestran el nombre de tus medicamentos.</Body>
      </Card>

      <Card>
        <Subtitle>Borrar todos mis datos</Subtitle>
        <Body muted>Elimina registros, medicamentos, controles, recordatorios y la llave de cifrado. No se puede deshacer.</Body>
        {confirming ? (
          <>
            <Banner kind="danger">
              <Body>Escribe BORRAR para confirmar.</Body>
            </Banner>
            <TextInput
              style={styles.input}
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
              placeholder="BORRAR"
              placeholderTextColor={colors.muted}
            />
            <Button kind="danger" label="Borrar todo" disabled={confirmText.trim() !== 'BORRAR'} onPress={onWipe} />
            <Button kind="secondary" label="Cancelar" onPress={() => { setConfirming(false); setConfirmText(''); }} />
          </>
        ) : (
          <Button kind="danger" label="Borrar todos mis datos" onPress={() => setConfirming(true)} />
        )}
      </Card>

      <Card>
        <Subtitle>Acerca de</Subtitle>
        <Body>Palladio Health · versión 1.0.0</Body>
        <View style={{ height: space.sm }} />
        <Body muted>{DISCLAIMER}</Body>
        <View style={{ height: space.sm }} />
        <Text style={styles.small}>Cuestionario: NIH-CPSI (Litwin et al., 1999).</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: space.md,
    fontSize: 16, color: colors.text, marginTop: space.sm,
  },
  small: { fontSize: 12, color: colors.muted },
});

import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { clearMedlineCache, getSetting, setSetting } from '../db/repo.ts';
import { MEDLINE_SETTING } from '../net/medlineplus.ts';
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
  const [medline, setMedline] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    getSetting(LOCK_SETTING).then((v) => v !== null && setLockMs(Number(v)));
    getSetting(MEDLINE_SETTING).then((v) => setMedline(v === '1'));
  }, []);

  const toggleMedline = async (on: boolean) => {
    setMedline(on);
    await setSetting(MEDLINE_SETTING, on ? '1' : '0');
  };

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
        <Body>• La única conexión a internet es la búsqueda en MedlinePlus, y solo si la activas. Solo envía el tema que buscas.</Body>
        <Body>• No hay cuentas, publicidad ni rastreadores.</Body>
        <Body>• Las capturas de pantalla están bloqueadas dentro de la app.</Body>
        <Body>• Los recordatorios no muestran el nombre de tus medicamentos.</Body>
      </Card>

      <Card>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Subtitle>Consultas a MedlinePlus</Subtitle>
            <Body muted>Apagado, la app no se conecta a internet para nada.</Body>
          </View>
          <Switch value={medline} onValueChange={toggleMedline} trackColor={{ true: colors.primary }} />
        </View>
        <Button
          kind="secondary"
          label={cacheCleared ? 'Búsquedas guardadas borradas ✓' : 'Borrar búsquedas guardadas'}
          disabled={cacheCleared}
          onPress={async () => { await clearMedlineCache(); setCacheCleared(true); }}
        />
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
        <Body>Palladio Health · versión 1.1.0</Body>
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
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: space.md,
    fontSize: 16, color: colors.text, marginTop: space.sm,
  },
  small: { fontSize: 12, color: colors.muted },
});

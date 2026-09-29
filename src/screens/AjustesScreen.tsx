import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { DISCLAIMER } from '../content/habitos.ts';
import { clearMedlineCache, getSetting, setSetting } from '../db/repo.ts';
import { modulesFor } from '../modules/index.ts';
import type { ConditionId } from '../modules/types.ts';
import { MEDLINE_SETTING } from '../net/medlineplus.ts';
import { parseLockMode, type LockMode } from '../security/LockGate.tsx';
import { Banner, Body, Button, Card, Chip, Subtitle, Title } from '../ui/components.tsx';
import { Input } from '../ui/keyboard.tsx';
import { colors, space } from '../ui/theme.ts';
import { AntecedentesSection } from './AntecedentesSection.tsx';
import { PerfilPicker } from './PerfilPicker.tsx';
import { RespaldoSection } from './RespaldoSection.tsx';

export const LOCK_SETTING = 'lock_mode';
export const SCREENSHOTS_SETTING = 'screenshots_blocked';

const LOCK_OPTIONS: { mode: LockMode; label: string }[] = [
  { mode: 'never', label: 'Nunca' },
  { mode: 'open', label: 'Al abrir' },
  { mode: 60_000, label: 'Tras 1 min' },
  { mode: 5 * 60_000, label: 'Tras 5 min' },
];

type Props = {
  profile: ConditionId[];
  onProfileChange: (c: ConditionId[]) => Promise<void>;
  onLockChange: (m: LockMode) => void;
  onScreenshotsChange: (blocked: boolean) => void;
  onWipe: () => Promise<void>;
  onImported: () => void;
};

export function AjustesScreen({ profile, onProfileChange, onLockChange, onScreenshotsChange, onWipe, onImported }: Props) {
  const [lock, setLock] = useState<LockMode>('never');
  const [blocked, setBlocked] = useState(false);
  const [medline, setMedline] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    getSetting(LOCK_SETTING).then((v) => setLock(parseLockMode(v)));
    getSetting(SCREENSHOTS_SETTING).then((v) => setBlocked(v === '1'));
    getSetting(MEDLINE_SETTING).then((v) => setMedline(v === '1'));
  }, []);

  const chooseLock = async (m: LockMode) => {
    setLock(m);
    await setSetting(LOCK_SETTING, String(m));
    onLockChange(m);
  };

  const toggleScreenshots = async () => {
    const next = !blocked;
    setBlocked(next);
    await setSetting(SCREENSHOTS_SETTING, next ? '1' : '0');
    onScreenshotsChange(next);
  };

  const toggleMedline = async (on: boolean) => {
    setMedline(on);
    await setSetting(MEDLINE_SETTING, on ? '1' : '0');
  };

  return (
    <View>
      <Title>Ajustes</Title>

      <Card>
        <Subtitle>👤 Mi perfil</Subtitle>
        {editingProfile ? (
          <PerfilPicker
            initial={profile}
            saveLabel="Guardar mi perfil"
            onSave={async (c) => { await onProfileChange(c); setEditingProfile(false); }}
          />
        ) : (
          <>
            {profile.length === 0
              ? <Body muted>No elegiste condiciones.</Body>
              : modulesFor(profile).map((m) => <Body key={m.id}>{m.emoji} {m.name}</Body>)}
            <Button kind="secondary" label="Cambiar mis condiciones" onPress={() => setEditingProfile(true)} />
          </>
        )}
      </Card>

      <AntecedentesSection />

      <Card>
        <Subtitle>🔒 Pedir huella o PIN</Subtitle>
        <Body muted>Tus datos están cifrados siempre. El bloqueo evita que alguien con tu teléfono desbloqueado abra la app.</Body>
        <View style={styles.row}>
          {LOCK_OPTIONS.map((o) => (
            <Chip key={String(o.mode)} label={o.label} selected={lock === o.mode} onPress={() => chooseLock(o.mode)} />
          ))}
        </View>
      </Card>

      <Card>
        <Pressable accessibilityRole="switch" accessibilityState={{ checked: blocked }} onPress={toggleScreenshots} style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Subtitle>📵 Bloquear capturas de pantalla</Subtitle>
            <Body muted>
              {blocked
                ? 'Activado: no se pueden hacer capturas y la app sale en blanco en "apps recientes".'
                : 'Desactivado: puedes hacer capturas de pantalla (por ejemplo, para mostrarle algo a tu médico).'}
            </Body>
          </View>
          <Switch value={blocked} onValueChange={toggleScreenshots} trackColor={{ true: colors.primary }} />
        </Pressable>
      </Card>

      <Card>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Subtitle>📚 Consultas a MedlinePlus</Subtitle>
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

      <RespaldoSection onImported={onImported} />

      <Card>
        <Subtitle>Tu privacidad</Subtitle>
        <Body>• Tus datos se guardan solo en este teléfono, cifrados con AES-256.</Body>
        <Body>• La única conexión a internet es la búsqueda en MedlinePlus, y solo si la activas.</Body>
        <Body>• No hay cuentas, publicidad ni rastreadores.</Body>
        <Body>• Los recordatorios no muestran el nombre de tus medicamentos.</Body>
      </Card>

      <Card>
        <Subtitle>Borrar todos mis datos</Subtitle>
        <Body muted>Elimina registros, perfil, medicamentos, controles, recordatorios y la llave de cifrado. No se puede deshacer.</Body>
        {confirming ? (
          <>
            <Banner kind="danger"><Body>Escribe BORRAR para confirmar.</Body></Banner>
            <Input
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
        <Body>Palladio Health · versión 2.0.0</Body>
        <View style={{ height: space.sm }} />
        <Body muted>{DISCLAIMER}</Body>
        <View style={{ height: space.sm }} />
        <Text style={styles.small}>Cuestionarios: NIH-CPSI (Litwin et al., 1999) e IBS-SSS (Francis et al., 1997).</Text>
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

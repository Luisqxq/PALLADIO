// Respaldo cifrado: exportar a un archivo protegido con contraseña y restaurar.

import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { collectBackupData, restoreBackupData } from '../db/backup.ts';
import { listMedications, setNotificationIds } from '../db/repo.ts';
import { decryptBackup, encryptBackup, MIN_PASSWORD_LENGTH } from '../logic/backup.ts';
import { today } from '../logic/dates.ts';
import { rescheduleAll } from '../notifications.ts';
import { withSystemDialog } from '../security/LockGate.tsx';
import { Banner, Body, Button, Card, Subtitle } from '../ui/components.tsx';
import { Input } from '../ui/keyboard.tsx';
import { colors, space } from '../ui/theme.ts';

type Mode = 'idle' | 'export' | 'import';

export function RespaldoSection({ onImported }: { onImported: () => void }) {
  const [mode, setMode] = useState<Mode>('idle');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fileText, setFileText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'info' | 'danger'; text: string } | null>(null);

  const reset = () => {
    setMode('idle'); setPassword(''); setConfirm(''); setFileText(null); setBusy(false);
  };

  const doExport = async () => {
    setBusy(true);
    setMessage(null);
    let file: File | null = null;
    try {
      const data = JSON.stringify(await collectBackupData());
      const sealed = await encryptBackup(data, password, (n) => Crypto.getRandomBytes(n));
      file = new File(Paths.cache, `palladio-respaldo-${today()}.palladio`);
      if (file.exists) file.delete();
      file.create();
      file.write(sealed);
      await withSystemDialog(() => Sharing.shareAsync(file!.uri, {
        mimeType: 'application/octet-stream',
        dialogTitle: 'Guardar respaldo de Palladio Health',
      }));
      setMessage({
        kind: 'info',
        text: 'Respaldo creado. Guárdalo en tu Drive o en un lugar seguro, y no olvides la contraseña: sin ella nadie puede abrirlo, ni siquiera tú.',
      });
      reset();
    } catch (e) {
      setMessage({ kind: 'danger', text: e instanceof Error ? e.message : 'No se pudo crear el respaldo.' });
      setBusy(false);
    } finally {
      // La copia temporal se borra: el archivo queda solo donde lo guardaste.
      try { if (file?.exists) file.delete(); } catch { /* se ignora */ }
    }
  };

  const pickFile = async () => {
    setMessage(null);
    const res = await withSystemDialog(() => DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true }));
    if (res.canceled || !res.assets?.[0]) return;
    const picked = new File(res.assets[0].uri);
    try {
      if ((picked.size ?? 0) > 20_000_000) throw new Error('El archivo es demasiado grande para ser un respaldo.');
      setFileText(await picked.text());
      setMode('import');
    } catch (e) {
      setMessage({ kind: 'danger', text: e instanceof Error ? e.message : 'No se pudo leer el archivo.' });
    } finally {
      try { if (picked.exists) picked.delete(); } catch { /* se ignora */ }
    }
  };

  const doImport = async () => {
    if (!fileText) return;
    setBusy(true);
    setMessage(null);
    try {
      const plain = await decryptBackup(fileText, password);
      await restoreBackupData(JSON.parse(plain));
      const meds = await listMedications();
      const ok = await withSystemDialog(() => rescheduleAll(meds, setNotificationIds));
      reset();
      setMessage({
        kind: 'info',
        text: ok ? 'Datos restaurados.' : 'Datos restaurados. Activa las notificaciones para recuperar los recordatorios.',
      });
      onImported();
    } catch (e) {
      setMessage({ kind: 'danger', text: e instanceof Error ? e.message : 'No se pudo restaurar el respaldo.' });
      setBusy(false);
    }
  };

  const tooShort = password.length < MIN_PASSWORD_LENGTH;

  return (
    <Card>
      <Subtitle>💾 Respaldo cifrado</Subtitle>
      <Body muted>
        Guarda todos tus datos en un archivo protegido con una contraseña que eliges tú (cifrado AES-256). Úsalo si
        cambias de teléfono o vas a desinstalar la app.
      </Body>
      {message && (
        <Banner kind={message.kind}><Body>{message.text}</Body></Banner>
      )}

      {mode === 'idle' && (
        <>
          <Button label="Crear respaldo" onPress={() => { setMode('export'); setMessage(null); }} />
          <Button kind="secondary" label="Restaurar desde un respaldo" onPress={pickFile} />
        </>
      )}

      {mode !== 'idle' && (
        <View style={{ marginTop: space.md }}>
          {mode === 'import' && (
            <Banner kind="warn">
              <Body>Restaurar reemplaza TODOS los datos actuales de este teléfono por los del respaldo.</Body>
            </Banner>
          )}
          <Text style={styles.label}>Contraseña del respaldo</Text>
          <Input
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
            placeholderTextColor={colors.muted}
          />
          {mode === 'export' && (
            <>
              <Text style={styles.label}>Repite la contraseña</Text>
              <Input
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                placeholderTextColor={colors.muted}
              />
              {!!confirm && confirm !== password && <Text style={styles.error}>Las contraseñas no coinciden.</Text>}
            </>
          )}
          {busy ? (
            <View style={styles.busy}>
              <ActivityIndicator color={colors.primary} />
              <Body muted>{mode === 'export' ? 'Cifrando… puede tardar unos segundos.' : 'Descifrando…'}</Body>
            </View>
          ) : (
            <>
              <Button
                label={mode === 'export' ? 'Cifrar y guardar' : 'Restaurar'}
                kind={mode === 'import' ? 'danger' : 'primary'}
                disabled={tooShort || (mode === 'export' && confirm !== password)}
                onPress={mode === 'export' ? doExport : doImport}
              />
              <Button kind="secondary" label="Cancelar" onPress={reset} />
            </>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: space.sm, marginBottom: space.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: space.md, fontSize: 16, color: colors.text },
  error: { color: colors.danger, marginTop: space.xs },
  busy: { flexDirection: 'row', gap: space.sm, alignItems: 'center', marginTop: space.md },
});

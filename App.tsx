import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DISCLAIMER } from './src/content/habitos.ts';
import { DatabaseLockedError, openDatabase, wipeEverything } from './src/db/database.ts';
import { getSetting, setSetting } from './src/db/repo.ts';
import { cancelAllReminders } from './src/notifications.ts';
import { AjustesScreen, LOCK_SETTING } from './src/screens/AjustesScreen.tsx';
import { CuestionarioScreen } from './src/screens/CuestionarioScreen.tsx';
import { GuiaScreen } from './src/screens/GuiaScreen.tsx';
import { HistorialScreen } from './src/screens/HistorialScreen.tsx';
import { HoyScreen } from './src/screens/HoyScreen.tsx';
import { MedicamentosScreen } from './src/screens/MedicamentosScreen.tsx';
import { DEFAULT_LOCK_AFTER_MS, LockGate } from './src/security/LockGate.tsx';
import { Body, Button, Card, Title } from './src/ui/components.tsx';
import { colors, space } from './src/ui/theme.ts';

type Tab = 'hoy' | 'meds' | 'control' | 'historial' | 'guia' | 'ajustes';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'hoy', icon: '📝', label: 'Hoy' },
  { id: 'meds', icon: '💊', label: 'Pastillas' },
  { id: 'control', icon: '📋', label: 'Control' },
  { id: 'historial', icon: '📈', label: 'Evolución' },
  { id: 'guia', icon: '🌿', label: 'Guía' },
  { id: 'ajustes', icon: '⚙️', label: 'Ajustes' },
];

const DISCLAIMER_SETTING = 'disclaimer_accepted';

type DbState =
  | { status: 'loading' }
  | { status: 'ready'; disclaimerAccepted: boolean }
  | { status: 'error'; message: string; lostKey: boolean };

// Las capturas de pantalla se bloquean en Android con FLAG_SECURE desde
// plugins/withSecureWindow.js, antes de que cargue esta interfaz.
export default function App() {
  const [lockAfterMs, setLockAfterMs] = useState(DEFAULT_LOCK_AFTER_MS);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <LockGate lockAfterMs={lockAfterMs}>
          <Main onLockChange={setLockAfterMs} />
        </LockGate>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Main({ onLockChange }: { onLockChange: (ms: number) => void }) {
  const [db, setDb] = useState<DbState>({ status: 'loading' });
  const [tab, setTab] = useState<Tab>('hoy');

  const init = useCallback(async () => {
    setDb({ status: 'loading' });
    try {
      await openDatabase();
      const lock = await getSetting(LOCK_SETTING);
      if (lock !== null) onLockChange(Number(lock));
      setDb({ status: 'ready', disclaimerAccepted: (await getSetting(DISCLAIMER_SETTING)) === '1' });
    } catch (e) {
      setDb({
        status: 'error',
        lostKey: e instanceof DatabaseLockedError,
        message: e instanceof Error ? e.message : 'Error desconocido',
      });
    }
  }, [onLockChange]);

  useEffect(() => {
    init();
  }, [init]);

  const wipe = useCallback(async () => {
    await cancelAllReminders().catch(() => {});
    await wipeEverything();
    onLockChange(DEFAULT_LOCK_AFTER_MS);
    setTab('hoy');
    await init();
  }, [init, onLockChange]);

  if (db.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (db.status === 'error') {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Title>No se pudieron abrir tus datos</Title>
        <Card>
          <Body>{db.message}</Body>
          {db.lostKey && (
            <>
              <View style={{ height: space.sm }} />
              <Body>
                Tus datos siguen cifrados en el teléfono, pero sin su llave nadie puede leerlos, ni siquiera la app.
                Puedes empezar de cero; se borrarán los datos anteriores.
              </Body>
            </>
          )}
        </Card>
        <Button label="Reintentar" onPress={init} />
        {db.lostKey && <Button kind="danger" label="Borrar y empezar de cero" onPress={wipe} />}
      </ScrollView>
    );
  }

  if (!db.disclaimerAccepted) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>🌿</Text>
        <Title>Bienvenido a Palladio Health</Title>
        <Card>
          <Body>Tu diario de salud y guía para vivir mejor con la prostatitis y cuidar tu colon, mezclando lo tradicional con lo moderno.</Body>
        </Card>
        <Card>
          <Body>{DISCLAIMER}</Body>
        </Card>
        <Card>
          <Body>🔒 Tus datos se guardan solo en este teléfono, cifrados. La app no usa internet.</Body>
        </Card>
        <Button
          label="Entendido, empezar"
          onPress={async () => {
            await setSetting(DISCLAIMER_SETTING, '1');
            setDb({ status: 'ready', disclaimerAccepted: true });
          }}
        />
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {tab === 'hoy' && <HoyScreen />}
        {tab === 'meds' && <MedicamentosScreen />}
        {tab === 'control' && <CuestionarioScreen />}
        {tab === 'historial' && <HistorialScreen />}
        {tab === 'guia' && <GuiaScreen />}
        {tab === 'ajustes' && <AjustesScreen onLockChange={onLockChange} onWipe={wipe} />}
      </ScrollView>
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.id }}
            onPress={() => setTab(t.id)}
            style={styles.tabItem}
          >
            <Text style={styles.tabIcon}>{t.icon}</Text>
            <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelOn]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, paddingBottom: space.xl * 2 },
  logo: { fontSize: 48, textAlign: 'center', marginVertical: space.md },
  tabBar: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.card, paddingVertical: 6,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
  tabLabelOn: { color: colors.primary, fontWeight: '700' },
});

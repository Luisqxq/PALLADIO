import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { setScreenCaptureBlocked } from './modules/secure-window/index.ts';
import { DISCLAIMER } from './src/content/habitos.ts';
import { DatabaseLockedError, openDatabase, wipeEverything } from './src/db/database.ts';
import { getProfile, getSetting, saveProfile, setSetting } from './src/db/repo.ts';
import type { ConditionId } from './src/modules/types.ts';
import { cancelAllReminders } from './src/notifications.ts';
import { AjustesScreen, LOCK_SETTING, SCREENSHOTS_SETTING } from './src/screens/AjustesScreen.tsx';
import { CuestionarioScreen } from './src/screens/CuestionarioScreen.tsx';
import { GuiaScreen } from './src/screens/GuiaScreen.tsx';
import { HistorialScreen } from './src/screens/HistorialScreen.tsx';
import { HoyScreen } from './src/screens/HoyScreen.tsx';
import { MedicamentosScreen } from './src/screens/MedicamentosScreen.tsx';
import { PerfilPicker } from './src/screens/PerfilPicker.tsx';
import { LockGate, parseLockMode, type LockMode } from './src/security/LockGate.tsx';
import { Body, Button, Card, Title } from './src/ui/components.tsx';
import { KeyboardScrollView } from './src/ui/keyboard.tsx';
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

type AppState =
  | { status: 'loading' }
  | { status: 'error'; message: string; lostKey: boolean }
  | {
    status: 'ready';
    disclaimerAccepted: boolean;
    profile: ConditionId[];
    profileConfirmed: boolean;
    lock: LockMode;
  };

// Las capturas se bloquean desde que se crea la ventana (FLAG_SECURE en
// plugins/withSecureWindow.js) y luego se aplica lo que elija el usuario:
// por defecto, permitidas (pendiente #2).
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Main />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Main() {
  const [state, setState] = useState<AppState>({ status: 'loading' });
  const [tab, setTab] = useState<Tab>('hoy');
  // Cambia para volver a montar las pantallas (p. ej. tras restaurar un respaldo).
  const [generation, setGeneration] = useState(0);

  const init = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      await openDatabase();
      await setScreenCaptureBlocked((await getSetting(SCREENSHOTS_SETTING)) === '1').catch(() => {});
      const profile = await getProfile();
      setState({
        status: 'ready',
        disclaimerAccepted: (await getSetting(DISCLAIMER_SETTING)) === '1',
        profile: profile.conditions,
        profileConfirmed: profile.confirmed,
        lock: parseLockMode(await getSetting(LOCK_SETTING)),
      });
    } catch (e) {
      setState({
        status: 'error',
        lostKey: e instanceof DatabaseLockedError,
        message: e instanceof Error ? e.message : 'Error desconocido',
      });
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const wipe = useCallback(async () => {
    await cancelAllReminders().catch(() => {});
    await wipeEverything();
    setTab('hoy');
    await init();
  }, [init]);

  if (state.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <KeyboardScrollView contentContainerStyle={styles.content}>
        <Title>No se pudieron abrir tus datos</Title>
        <Card>
          <Body>{state.message}</Body>
          {state.lostKey && (
            <>
              <View style={{ height: space.sm }} />
              <Body>
                Tus datos siguen cifrados en el teléfono, pero sin su llave nadie puede leerlos, ni siquiera la app.
                Puedes empezar de cero; se borrarán los datos anteriores. Si tienes un respaldo, podrás restaurarlo
                después en Ajustes.
              </Body>
            </>
          )}
        </Card>
        <Button label="Reintentar" onPress={init} />
        {state.lostKey && <Button kind="danger" label="Borrar y empezar de cero" onPress={wipe} />}
      </KeyboardScrollView>
    );
  }

  if (!state.disclaimerAccepted) {
    return (
      <KeyboardScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>🌿</Text>
        <Title>Bienvenido a Palladio Health</Title>
        <Card>
          <Body>Tu diario de salud y guía para vivir mejor con tus condiciones, mezclando lo tradicional con lo moderno.</Body>
        </Card>
        <Card><Body>{DISCLAIMER}</Body></Card>
        <Card>
          <Body>🔒 Tus datos se guardan solo en este teléfono, cifrados. La app solo usa internet si activas las búsquedas en MedlinePlus, y nunca envía tus registros.</Body>
        </Card>
        <Button
          label="Entendido, empezar"
          onPress={async () => {
            await setSetting(DISCLAIMER_SETTING, '1');
            setState({ ...state, disclaimerAccepted: true });
          }}
        />
      </KeyboardScrollView>
    );
  }

  if (!state.profileConfirmed) {
    return (
      <KeyboardScrollView contentContainerStyle={styles.content}>
        <Title>¿Qué quieres cuidar?</Title>
        <Body muted>Marca tus condiciones. La app se adapta a ti: cada persona ve solo lo suyo.</Body>
        <View style={{ height: space.md }} />
        <PerfilPicker
          initial={state.profile}
          saveLabel="Continuar"
          onSave={async (conditions) => {
            await saveProfile(conditions);
            setState({ ...state, profile: conditions, profileConfirmed: true });
          }}
        />
      </KeyboardScrollView>
    );
  }

  const { profile } = state;

  return (
    <LockGate mode={state.lock}>
      <View style={{ flex: 1 }} key={generation}>
        <KeyboardScrollView key={tab} contentContainerStyle={styles.content}>
          {tab === 'hoy' && <HoyScreen profile={profile} />}
          {tab === 'meds' && <MedicamentosScreen />}
          {tab === 'control' && <CuestionarioScreen profile={profile} />}
          {tab === 'historial' && <HistorialScreen profile={profile} />}
          {tab === 'guia' && <GuiaScreen profile={profile} />}
          {tab === 'ajustes' && (
            <AjustesScreen
              profile={profile}
              onProfileChange={async (conditions) => {
                await saveProfile(conditions);
                setState({ ...state, profile: conditions });
              }}
              onLockChange={(lock) => setState({ ...state, lock })}
              onScreenshotsChange={(blocked) => { setScreenCaptureBlocked(blocked).catch(() => {}); }}
              onWipe={wipe}
              onImported={() => {
                setGeneration((g) => g + 1);
                init();
              }}
            />
          )}
        </KeyboardScrollView>
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
    </LockGate>
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

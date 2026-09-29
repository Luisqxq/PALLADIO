// Bloquea la app con huella o con el PIN/patrón del teléfono, según lo que
// elija el usuario en Ajustes. Por defecto no se pide (pendiente #1): los datos
// siguen cifrados igual.

import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui/components.tsx';
import { colors, space } from '../ui/theme.ts';

// 'never': nunca; 'open': solo al abrir la app; número: al abrir y al volver
// después de esos milisegundos en segundo plano.
export type LockMode = 'never' | 'open' | number;
export const DEFAULT_LOCK_MODE: LockMode = 'never';

export function parseLockMode(v: string | null): LockMode {
  if (v === 'open' || v === 'never') return v;
  const n = Number(v);
  return v !== null && Number.isFinite(n) && n >= 0 ? n : DEFAULT_LOCK_MODE;
}

// Los diálogos del sistema (por ejemplo, el permiso de notificaciones) mandan
// la app a segundo plano un momento. Mientras duran, no se bloquea.
let systemDialogs = 0;
export async function withSystemDialog<T>(fn: () => Promise<T>): Promise<T> {
  systemDialogs++;
  try {
    return await fn();
  } finally {
    systemDialogs--;
  }
}

type Props = { children: ReactNode; mode: LockMode };

export function LockGate({ children, mode }: Props) {
  const [unlocked, setUnlocked] = useState(mode === 'never');
  const [message, setMessage] = useState<string | null>(null);
  const authenticating = useRef(false);
  const backgroundedAt = useRef<number | null>(null);

  const authenticate = useCallback(async () => {
    if (authenticating.current) return;
    authenticating.current = true;
    setMessage(null);
    try {
      const level = await LocalAuthentication.getEnrolledLevelAsync();
      if (level === LocalAuthentication.SecurityLevel.NONE) {
        setMessage(
          'Tu teléfono no tiene bloqueo de pantalla. Para proteger tus datos de salud, ' +
            'configura un PIN, patrón o huella en Ajustes del teléfono > Seguridad, y vuelve a intentar.',
        );
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear Palladio Health',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });
      if (result.success) {
        setUnlocked(true);
      } else if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
        setMessage('No se pudo verificar tu identidad. Intenta de nuevo.');
      }
    } catch {
      setMessage('No se pudo verificar tu identidad. Intenta de nuevo.');
    } finally {
      authenticating.current = false;
    }
  }, []);

  useEffect(() => {
    if (mode === 'never') setUnlocked(true);
    else if (!unlocked) authenticate();
    // Solo al montar o si cambia el modo.
  }, [mode]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      // El diálogo de huella y los del sistema también cambian el estado.
      if (authenticating.current || systemDialogs > 0) {
        backgroundedAt.current = null;
        return;
      }
      if (state === 'background') {
        backgroundedAt.current = Date.now();
      } else if (state === 'active' && backgroundedAt.current !== null) {
        const away = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (typeof mode === 'number' && away >= mode) {
          setUnlocked(false);
          authenticate();
        }
      }
    });
    return () => sub.remove();
  }, [authenticate, mode]);

  if (unlocked) return <>{children}</>;

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🌿</Text>
      <Text style={styles.title}>Palladio Health</Text>
      <Text style={styles.text}>Tus datos están cifrados y protegidos.</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      <View style={{ alignSelf: 'stretch', marginTop: space.lg }}>
        <Button label="Desbloquear" onPress={authenticate} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: colors.bg },
  logo: { fontSize: 56, marginBottom: space.md },
  title: { fontSize: 26, fontWeight: '700', color: colors.primary },
  text: { fontSize: 15, color: colors.muted, marginTop: space.sm, textAlign: 'center' },
  message: { fontSize: 15, color: colors.danger, marginTop: space.lg, textAlign: 'center', lineHeight: 22 },
});

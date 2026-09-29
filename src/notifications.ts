// Recordatorios locales de medicamentos. Todo ocurre dentro del teléfono:
// no se usa ningún servicio de notificaciones por internet.
// El texto no dice el nombre del medicamento, para que no se lea en la
// pantalla de bloqueo.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'recordatorios';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Recordatorios de medicamentos',
    importance: Notifications.AndroidImportance.HIGH,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function ensurePermission(): Promise<boolean> {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function scheduleDailyReminders(times: string[]): Promise<string[]> {
  await ensureChannel();
  const ids: string[] = [];
  for (const t of times) {
    const [hour, minute] = t.split(':').map(Number);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Palladio Health',
        body: `Es hora de tu toma de las ${t}.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
    ids.push(id);
  }
  return ids;
}

export async function cancelReminders(ids: string[]): Promise<void> {
  for (const id of ids) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Vuelve a programar los recordatorios de todos los medicamentos activos
// (por ejemplo, después de restaurar un respaldo).
export async function rescheduleAll(
  meds: { id: number; times: string[]; reminders: boolean }[],
  saveIds: (id: number, ids: string[]) => Promise<void>,
): Promise<boolean> {
  await cancelAllReminders();
  const withReminders = meds.filter((m) => m.reminders && m.times.length > 0);
  if (withReminders.length === 0) return true;
  if (!(await ensurePermission())) return false;
  for (const m of withReminders) await saveIds(m.id, await scheduleDailyReminders(m.times));
  return true;
}

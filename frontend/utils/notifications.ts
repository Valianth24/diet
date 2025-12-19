import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_CHANNEL_ID = 'diet-reminders';
const REMINDER_NOTIFICATION_KEYS: Record<'water' | 'vitamin', string> = {
  water: 'water_reminder_notification_ids',
  vitamin: 'vitamin_reminder_notification_ids',
};

let _notifications: any = null;

export const getNotifications = () => {
  if (!_notifications) {
    try {
      _notifications = require('expo-notifications');
      _notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch (error) {
      console.log('Notifications not available');
    }
  }
  return _notifications;
};

export const requestNotificationPermission = async () => {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  try {
    const currentPermissions = await Notifications.getPermissionsAsync();
    let status = currentPermissions.status;

    if (status !== 'granted') {
      const permissionResponse = await Notifications.requestPermissionsAsync();
      status = permissionResponse.status;
    }

    if (status !== 'granted') {
      return false;
    }

    await ensureAndroidChannel();
    return true;
  } catch (error) {
    console.log('Notifications not available');
    return false;
  }
};

export const ensureAndroidChannel = async () => {
  const Notifications = getNotifications();
  if (!Notifications) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Diet Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      enableVibrate: true,
    });
  }
};

export const clearReminderNotifications = async (type: 'water' | 'vitamin') => {
  const Notifications = getNotifications();
  if (!Notifications) return;

  const storedIds = await AsyncStorage.getItem(REMINDER_NOTIFICATION_KEYS[type]);
  if (storedIds) {
    const ids: string[] = JSON.parse(storedIds);
    await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
  }

  await AsyncStorage.removeItem(REMINDER_NOTIFICATION_KEYS[type]);
};

interface ScheduleReminderOptions {
  type: 'water' | 'vitamin';
  enabled: boolean;
  times: string[];
  content: {
    title: string;
    body: string;
    sound?: string | boolean;
  };
}

export const syncReminderNotifications = async ({ type, enabled, times, content }: ScheduleReminderOptions) => {
  const Notifications = getNotifications();
  if (!Notifications) return;

  // Always clear previously scheduled notifications for this type
  await clearReminderNotifications(type);

  if (!enabled || !times.length) {
    return;
  }

  await ensureAndroidChannel();

  const ids: string[] = [];

  for (const time of times) {
    const [hour, minute] = time.split(':').map(Number);

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) continue;

    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        hour,
        minute,
        repeats: true,
        channelId: REMINDER_CHANNEL_ID,
      },
    });

    ids.push(id);
  }

  if (ids.length) {
    await AsyncStorage.setItem(REMINDER_NOTIFICATION_KEYS[type], JSON.stringify(ids));
  }
};

import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
} from '@notifee/react-native';
import {
  CHANNEL_ALARM,
  CHANNEL_WARNING,
  CHANNEL_OK,
} from '../constants/config';
import { AlertResult } from '../api/types';

// ── Create all notification channels (call once at app startup) ──────────────
export async function setupNotificationChannels(): Promise<void> {
  // ALARM channel — highest importance, fires even on silent
  await notifee.createChannel({
    id: CHANNEL_ALARM,
    name: 'BVG Cancellation Alarm',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    //vibrationPattern: [0, 500, 200, 500],
    sound: 'default',
    lights: true,
    lightColor: '#FF0000',
  });

  // WARNING channel — high importance, normal sound
  await notifee.createChannel({
    id: CHANNEL_WARNING,
    name: 'BVG Delay Warning',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    sound: 'default',
  });

  // OK channel — low importance, silent
  await notifee.createChannel({
    id: CHANNEL_OK,
    name: 'BVG Status OK',
    importance: AndroidImportance.LOW,
    visibility: AndroidVisibility.PRIVATE,
    vibration: false,
  });

  console.log('[Notifee] Channels created');
}

// ── Request notification permission (Android 13+) ───────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  const granted = settings.authorizationStatus >= 1;
  console.log('[Notifee] Permission granted:', granted);
  return granted;
}

// ── ALARM notification — cancellation detected ───────────────────────────────
export async function sendAlarmNotification(
  result: AlertResult,
  minutesBefore: number,
  routeName: string
): Promise<void> {
  await notifee.displayNotification({
    title: `🚨 CANCELLED — ${minutesBefore} min warning`,
    body: `${routeName}\n${result.details.join('\n')}\n\nCheck BVG app for alternatives NOW.`,
    android: {
      channelId: CHANNEL_ALARM,
      importance: AndroidImportance.HIGH,
      category: AndroidCategory.ALARM,
      fullScreenAction: {
        id: 'alarm',
      },
      pressAction: {
        id: 'default',
      },
      actions: [
        {
          title: 'Open BVG App',
          pressAction: { id: 'open_bvg' },
        },
        {
          title: 'Dismiss',
          pressAction: { id: 'dismiss' },
        },
      ],
      color: '#FF0000',
      colorized: true,
    },
  });
  console.log('[Notifee] ALARM sent for:', routeName);
}

// ── WARNING notification — delay detected ────────────────────────────────────
export async function sendWarningNotification(
  result: AlertResult,
  minutesBefore: number,
  routeName: string
): Promise<void> {
  await notifee.displayNotification({
    title: `⚠️ Delay — ${minutesBefore} min warning`,
    body: `${routeName}\n${result.details.join('\n')}`,
    android: {
      channelId: CHANNEL_WARNING,
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
      },
      actions: [
        {
          title: 'View Details',
          pressAction: { id: 'view' },
        },
      ],
      color: '#FFA500',
    },
  });
  console.log('[Notifee] WARNING sent for:', routeName);
}

// ── OK notification — all on time ────────────────────────────────────────────
export async function sendOkNotification(
  result: AlertResult,
  minutesBefore: number,
  routeName: string
): Promise<void> {
  const depTime = result.firstDeparture
    ? new Date(result.firstDeparture).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
  const duration = result.durationMins ? ` · ${result.durationMins} min` : '';

  await notifee.displayNotification({
    title: `✅ On time — ${minutesBefore} min check`,
    body: `${routeName}\nDeparture ${depTime}${duration} — running on time.`,
    android: {
      channelId: CHANNEL_OK,
      importance: AndroidImportance.LOW,
      pressAction: {
        id: 'default',
      },
      color: '#2ECC8A',
    },
  });
  console.log('[Notifee] OK sent for:', routeName);
}

// ── ERROR notification — API failed ─────────────────────────────────────────
export async function sendErrorNotification(
  minutesBefore: number,
  routeName: string
): Promise<void> {
  await notifee.displayNotification({
    title: `❓ Check failed — ${minutesBefore} min warning`,
    body: `Could not fetch BVG data for ${routeName}. Please check manually.`,
    android: {
      channelId: CHANNEL_WARNING,
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default' },
      color: '#888888',
    },
  });
  console.log('[Notifee] ERROR notification sent');
}

// ── Master dispatcher ────────────────────────────────────────────────────────
export async function dispatchAlert(
  result: AlertResult,
  minutesBefore: number,
  routeName: string
): Promise<void> {
  switch (result.status) {
    case 'CANCELLED':
      await sendAlarmNotification(result, minutesBefore, routeName);
      break;
    case 'DELAYED':
      await sendWarningNotification(result, minutesBefore, routeName);
      break;
    case 'OK':
      await sendOkNotification(result, minutesBefore, routeName);
      break;
    case 'ERROR':
      await sendErrorNotification(minutesBefore, routeName);
      break;
  }
}
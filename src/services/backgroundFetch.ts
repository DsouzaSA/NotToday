import BackgroundFetch from 'react-native-background-fetch';
//import { resolveStop, searchStops } from '../api/stops';
import { fetchJourneys, evaluateJourney } from '../api/journeys';
import { dispatchAlert } from './notificationService';
import { CHECK_OFFSETS_MINUTES } from '../constants/config';

export interface ScheduledRoute {
  id: string;
  originName: string;
  destinationName: string;
  originId: string;
  destinationId: string;
  departureTime: string; // 'HH:MM'
  enabled: boolean;
}

// ── Check if current time is within a check window ───────────────────────────
function getActiveCheckOffset(departureTime: string): number | null {
  const now = new Date();
  const [depHour, depMin] = departureTime.split(':').map(Number);

  const departure = new Date();
  departure.setHours(depHour, depMin, 0, 0);

  // Handle midnight crossover
  if (departure < now) {
    departure.setDate(departure.getDate() + 1);
  }

  const diffMinutes = Math.round((departure.getTime() - now.getTime()) / 60000);

  // Check if we're within ±3 minutes of any check offset
  for (const offset of CHECK_OFFSETS_MINUTES) {
    if (Math.abs(diffMinutes - offset) <= 3) {
      return offset;
    }
  }
  return null;
}

// ── Run a single route check ─────────────────────────────────────────────────
async function checkRoute(route: ScheduledRoute): Promise<void> {
  const offset = getActiveCheckOffset(route.departureTime);
  if (offset === null) {
    console.log(`[BG] ${route.originName} → ${route.destinationName}: not in check window`);
    return;
  }

  console.log(`[BG] Checking route at T-${offset} min: ${route.originName} → ${route.destinationName}`);

  const now = new Date();
  const [depHour, depMin] = route.departureTime.split(':').map(Number);
  const departure = new Date();
  departure.setHours(depHour, depMin, 0, 0);
  if (departure < now) {
    departure.setDate(departure.getDate() + 1);
  }

  const journeys = await fetchJourneys(
    route.originId,
    route.destinationId,
    departure.toISOString()
  );

  const routeName = `${route.originName} → ${route.destinationName}`;

  if (!journeys.length) {
    await dispatchAlert(
      { status: 'ERROR', details: [], firstDeparture: null, durationMins: null },
      offset,
      routeName
    );
    return;
  }

  const result = evaluateJourney(journeys[0]);
  console.log(`[BG] Result: ${result.status}`, result.details);
  await dispatchAlert(result, offset, routeName);
}

// ── Initialize background fetch ──────────────────────────────────────────────
export async function initBackgroundFetch(routes: ScheduledRoute[]): Promise<void> {
  const status = await BackgroundFetch.configure(
    {
      minimumFetchInterval: 15, // minimum 15 minutes on iOS
      stopOnTerminate: false,   // keep running after app is closed
      startOnBoot: true,        // restart after device reboot
      enableHeadless: true,     // run without UI on Android
      forceAlarmManager: true,  // use AlarmManager for exact timing on Android
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
    },
    async (taskId) => {
      console.log('[BG] Background fetch fired, taskId:', taskId);

      // Check all enabled routes
      const enabledRoutes = routes.filter(r => r.enabled);
      for (const route of enabledRoutes) {
        await checkRoute(route);
      }

      // Required: signal completion
      BackgroundFetch.finish(taskId);
    },
    async (taskId) => {
      // Timeout handler
      console.warn('[BG] Background fetch timeout:', taskId);
      BackgroundFetch.finish(taskId);
    }
  );

  console.log('[BG] BackgroundFetch status:', status);
}

// ── Schedule a one-time check (for exact alarm times) ────────────────────────
export async function scheduleExactCheck(
  route: ScheduledRoute,
  minutesBefore: number
): Promise<void> {
  const now = new Date();
  const [depHour, depMin] = route.departureTime.split(':').map(Number);
  const departure = new Date();
  departure.setHours(depHour, depMin, 0, 0);
  if (departure < now) {
    departure.setDate(departure.getDate() + 1);
  }

  const checkTime = new Date(departure.getTime() - minutesBefore * 60 * 1000);

  // If check time is already past, skip
  if (checkTime <= now) {
    console.log(`[BG] T-${minutesBefore} check already past, skipping`);
    return;
  }

  //const taskId = `check-${route.id}-${minutesBefore}`;
  const delay = checkTime.getTime() - now.getTime();

  console.log(`[BG] Scheduling T-${minutesBefore} check in ${Math.round(delay / 60000)} min`);

  // Use setTimeout for in-session scheduling
  // BackgroundFetch handles out-of-session scheduling
  setTimeout(async () => {
    console.log(`[BG] T-${minutesBefore} check firing for ${route.originName}`);
    await checkRoute(route);
  }, delay);
}

// ── Schedule all checks for a route ─────────────────────────────────────────
export async function scheduleAllChecks(route: ScheduledRoute): Promise<void> {
  console.log(`[BG] Scheduling all checks for ${route.originName} → ${route.destinationName} at ${route.departureTime}`);
  for (const offset of CHECK_OFFSETS_MINUTES) {
    await scheduleExactCheck(route, offset);
  }
}
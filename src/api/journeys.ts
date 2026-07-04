import bvgClient from './bvgClient';
import { BvgJourney, AlertResult } from './types';
import { DELAY_THRESHOLD_SECONDS, MAX_JOURNEY_RESULTS } from '../constants/config';

export async function fetchJourneys(
  originId: string,
  destinationId: string,
  departureISO: string
): Promise<BvgJourney[]> {
  try {
    const response = await bvgClient.get('/journeys', {
      params: {
        from: originId,
        to: destinationId,
        departure: departureISO,
        results: MAX_JOURNEY_RESULTS,
        stopovers: false,
        remarks: true,
      },
    });
    return response.data.journeys || [];
  } catch (error) {
    console.error('[fetchJourneys] Failed:', error);
    return [];
  }
}

export function evaluateJourney(journey: BvgJourney): AlertResult {
  const cancelledLegs: string[] = [];
  const delayedLegs: string[]   = [];
  let firstDeparture: string | null = null;
  let durationMins: number | null   = null;

  const legs = journey.legs || [];

  for (const leg of legs) {
    const lineName  = leg.line?.name || 'Unknown';
    const direction = leg.direction || '';
    const delay     = leg.departureDelay || 0;
    const cancelled = leg.cancelled || false;

    if (!firstDeparture && leg.departure) {
      firstDeparture = leg.departure;
    }

    if (cancelled) {
      cancelledLegs.push(`${lineName} → ${direction} [CANCELLED]`);
    } else if (delay > DELAY_THRESHOLD_SECONDS) {
      const mins = Math.round(delay / 60);
      delayedLegs.push(`${lineName} → ${direction} [+${mins} min]`);
    }
  }

  try {
    const firstLeg = legs[0];
    const lastLeg  = legs[legs.length - 1];
    if (firstLeg?.plannedDeparture && lastLeg?.plannedArrival) {
      const start = new Date(firstLeg.plannedDeparture).getTime();
      const end   = new Date(lastLeg.plannedArrival).getTime();
      durationMins = Math.round((end - start) / 60000);
    }
  } catch {}

  if (cancelledLegs.length > 0) {
    return { status: 'CANCELLED', details: cancelledLegs, firstDeparture, durationMins };
  }
  if (delayedLegs.length > 0) {
    return { status: 'DELAYED', details: delayedLegs, firstDeparture, durationMins };
  }
  return { status: 'OK', details: [], firstDeparture, durationMins };
}
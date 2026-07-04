export interface BvgStop {
  id: string;
  name: string;
  type: 'stop' | 'station';
}

export interface BvgLine {
  name: string;
  mode: string;
}

export interface BvgLeg {
  direction: string;
  line: BvgLine;
  departure: string;
  plannedDeparture: string;
  departureDelay: number | null;
  cancelled: boolean;
  arrival: string;
  plannedArrival: string;
  arrivalDelay: number | null;
}

export interface BvgJourney {
  legs: BvgLeg[];
}

export type AlertStatus = 'OK' | 'DELAYED' | 'CANCELLED' | 'ERROR';

export interface AlertResult {
  status: AlertStatus;
  details: string[];
  firstDeparture: string | null;
  durationMins: number | null;
}

export interface SavedRoute {
  id: string;
  originId: string;
  originName: string;
  destinationId: string;
  destinationName: string;
  departureTime: string;
  enabled: boolean;
}

export interface AlertHistoryItem {
  id: string;
  routeId: string;
  status: AlertStatus;
  details: string[];
  checkedAt: string;
  minutesBefore: number;
}
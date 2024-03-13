import { Stop } from '../Stop';
import { Coordinates } from '../Coordinates';
import { Bus } from '../Bus';

export const STOPS : Stop[] = [
  {
    id: '1',
    name: 'Pensiline',
    address: 'Via Pietro Bucci, Rende',
    coords: { lat: 39.35596, lon: 16.22733 } as Coordinates,
    nextBuses: [] as Bus[]
  }
];
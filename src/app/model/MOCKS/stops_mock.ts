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
  },
  {
    id: '2',
    name: 'Marconi Hotel',
    address: 'via Guglielmo Marconi, Rende',
    coords: { lat: 39.35325461, lon: 16.2350407 } as Coordinates,
    nextBuses: [] as Bus[]
  },
];
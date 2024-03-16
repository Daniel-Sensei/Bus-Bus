import { Stop } from '../Stop';
import { Bus } from '../Bus';
import { GeoPoint } from 'firebase/firestore';

export const STOPS : Stop[] = [
  {
    id: '1',
    name: 'Pensiline',
    address: 'Via Pietro Bucci, Rende',
    coords: { latitude: 39.35596, longitude: 16.22733 } as GeoPoint,
    nextBuses: [] as Bus[]
  },
  {
    id: '2',
    name: 'Marconi Hotel',
    address: 'via Guglielmo Marconi, Rende',
    coords: { latitude: 39.35325461, longitude: 16.2350407 } as GeoPoint,
    nextBuses: [] as Bus[]
  },
  {
    id: '3',
    name: 'Magola - Madonnina',
    address: 'via Basilio De Fazio, 2, Magolà',
    coords: { latitude: 38.97698, longitude: 16.33135 } as GeoPoint,
    nextBuses: [] as Bus[]
  },
  {
    id: '4',
    name: 'Parchetto Magolà',
    address: 'via Dario Galli, Magolà',
    coords: { latitude: 38.97660, longitude: 16.33049 } as GeoPoint,
    nextBuses: [] as Bus[]
  },
  {
    id: '5',
    name: 'Chiesa Magolà',
    address: 'via Dario Galli e Galline, Magolà',
    coords: { latitude: 38.97467, longitude: 16.32883 } as GeoPoint,
    nextBuses: [] as Bus[]
  },
  {
    id: '6',
    name: 'Casa Enzona',
    address: 'via Dario Galli, 78, Magolà',
    coords: { latitude: 38.97756, longitude: 16.33935 } as GeoPoint,
    nextBuses: [] as Bus[]
  },
  {
    id: '7',
    name: 'Casa Nonna',
    address: 'Piazza Carmelina Tropea, Magolà',
    coords: { latitude: 38.97863, longitude: 16.33420 } as GeoPoint,
    nextBuses: [] as Bus[]
  }
];
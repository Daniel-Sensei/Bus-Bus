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
  {
    id: '3',
    name: 'Magola - Madonnina',
    address: 'via Basilio De Fazio, 2, Magolà',
    coords: { lat: 38.97698, lon: 16.33135 } as Coordinates,
    nextBuses: [] as Bus[]
  },
  {
    id: '4',
    name: 'Parchetto Magolà',
    address: 'via Dario Galli, Magolà',
    coords: { lat: 38.97660, lon: 16.33049 } as Coordinates,
    nextBuses: [] as Bus[]
  },
  {
    id: '5',
    name: 'Chiesa Magolà',
    address: 'via Dario Galli e Galline, Magolà',
    coords: { lat: 38.97467, lon: 16.32883 } as Coordinates,
    nextBuses: [] as Bus[]
  },
  {
    id: '6',
    name: 'Casa Enzona',
    address: 'via Dario Galli, 78, Magolà',
    coords: { lat: 38.97756, lon: 16.33935 } as Coordinates,
    nextBuses: [] as Bus[]
  },
  {
    id: '7',
    name: 'Casa Nonna',
    address: 'Piazza Carmelina Tropea, Magolà',
    coords: { lat: 38.97863, lon: 16.33420 } as Coordinates,
    nextBuses: [] as Bus[]
  }
];
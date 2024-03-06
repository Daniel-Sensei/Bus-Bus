import { Stop } from '../Stop';

export const STOPS : Stop[] = [
  {
    id: 1,
    name: 'Stop 1',
    lat: 38.97635,
    lon: 16.32999,
    routes: [1, 2]
  },
  {
    id: 2,
    name: 'Stop 2',
    lat: 38.97887,
    lon: 16.33302,
    routes: [1, 3]
  },
  {
    id: 3,
    name: 'Stop 3',
    lat: 38.97726,
    lon: 16.33392,
    routes: [2, 3]
  },
  {
    id: 4,
    name: 'Stop 4 - Fronti',
    lat: 38.9829,
    lon: 16.3500,
    routes: [1, 2, 3]
  },
  {
    id: 5,
    name: 'Stop 5',
    lat: 38.97982,
    lon: 16.32959,
    routes: [1, 2, 3]
  },

  //cosenza
  {
    id: 6,
    name: 'Via della Resistenza, 23',
    lat: 39.36696,
    lon: 16.22678,
    routes: [4, 5]
  },
  {
    id: 7,
    name: 'viale della libertà, 54',
    lat: 39.3729,
    lon: 16.2347,
    routes: [4, 5]
  },
  {
    id: 8,
    name: 'Stop 8',
    lat: 39.35594,
    lon: 16.22734,
    routes: [4, 5]
  },
  {
    id: 9,
    name: 'Stop 9',
    lat: 39.36402,
    lon: 16.21724,
    routes: [4, 5]
  }
];
import { Bus } from "../Bus";
import { Stop } from "../Stop";
import { Coordinates } from "../Coordinates";
import { Route } from "../Route";

export const BUSES: Bus[] = [
    {
        id: '1',
        route: {
            id: '1',
            company: 'Cosenza Trasporti',
            code: '138A',
            stops: [{
                id: '1',
                name: 'Pensiline',
                address: 'Via Pietro Bucci, Rende',
                coords: { lat: 39.35596, lon: 16.22733 } as Coordinates,
                nextBuses: [] as Bus[]
            }],
            hours: [
                ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
            ],
        } as Route,
        coords: { lat: 39.35978, lon: 16.22789 } as Coordinates,
        speed: 30,
        //nextStops: [] as Stop[],
        lastStop: -1,
    },
    {
        id: '2',
        route: {
            id: '2',
            company: 'Lamezia Multiservizi',
            code: '6',
            stops: [
                {
                    id: '5',
                    name: 'Chiesa Magolà',
                    address: 'via Dario Galli e Galline, Magolà',
                    coords: { lat: 38.97467, lon: 16.32883 } as Coordinates,
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
                    id: '3',
                    name: 'Magola - Madonnina',
                    address: 'via Basilio De Fazio, 2, Magolà',
                    coords: { lat: 38.97698, lon: 16.33135 } as Coordinates,
                    nextBuses: [] as Bus[]
                },
                {
                    id: '7',
                    name: 'Casa Nonna',
                    address: 'Piazza Carmelina Tropea, Magolà',
                    coords: { lat: 38.97863, lon: 16.33420 } as Coordinates,
                    nextBuses: [] as Bus[]
                },
                {
                    id: '6',
                    name: 'Casa Enzona',
                    address: 'via Dario Galli, 78, Magolà',
                    coords: { lat: 38.97756, lon: 16.33935 } as Coordinates,
                    nextBuses: [] as Bus[]
                }
            ],
            hours: [
                ['08:00', '09:00', '11:00', '16:00', '19:00'],
                ['08:05', '09:05', '11:05', '16:05', '19:05'],
                ['08:06', '09:06', '11:06', '16:06', '19:06'],
                ['08:08', '09:08', '11:08', '16:08', '19:08'],
                ['08:10', '09:10', '11:10', '16:10', '19:10']
            ],
        } as Route,
        coords: { lat: 38.97467, lon: 16.32883 } as Coordinates, //parte dalla Chiesa
        speed: 30,
        //nextStops: [] as Stop[],
        lastStop: -1, //index della fermata precedente
    }
];
import { Bus } from "../Bus";
import { Stop } from "../Stop";
import { Coordinates } from "../Coordinates";
import { Route } from "../Route";

export const BUSES: Bus[] = [
    {
        id: '1',
        route: {
            id: '1',
            company: 'Cosenza Trasporti Cosenza Trasporti',
            code: '138A',
            stops: {
                '1': ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
            }
        } as Route,
        coords: { lat: 39.35978, lon: 16.22789 } as Coordinates,
        speed: 30,
        nextStops: [] as Stop[],
        lastStop: {} as Stop,
    },
];
import { Route } from './Route';
import { Stop } from './Stop';
import { Coordinates } from './Coordinates';

export interface Bus {
    id: string;
    route: Route;
    coords: Coordinates;
    speed: number;
    nextStops: Stop[];
    lastStop: Stop;
}
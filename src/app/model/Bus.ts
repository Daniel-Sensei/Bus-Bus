import { Route } from './Route';
import { Stop } from './Stop';
import { GeoPoint } from 'firebase/firestore';

export interface Bus {
    id: string;
    route: Route;
    coords: GeoPoint;
    speed: number;
    //nextStops: Stop[];
    lastStop: number;
}
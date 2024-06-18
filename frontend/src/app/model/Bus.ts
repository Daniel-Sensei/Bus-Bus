import { Route } from './Route';
import { GeoPoint } from 'firebase/firestore';

export interface Bus {
    id: string;
    route: Route;
    routeId: string;
    coords: GeoPoint;
    speed: number;
    lastStop: number;
    direction: string;

    delay?: string;
}
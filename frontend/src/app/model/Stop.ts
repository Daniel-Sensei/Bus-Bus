import { Bus } from "./Bus";
import { Coordinates } from "./Coordinates";
import { GeoPoint } from "firebase/firestore";

export interface Stop {
    id: string;
    name: string;
    address: string;
    coords: GeoPoint;
    nextBuses: Bus[];
}

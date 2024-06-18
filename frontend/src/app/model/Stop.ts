import { Bus } from "./Bus";
import { GeoPoint } from "firebase/firestore";

export interface Stop {
    id: string;
    name: string;
    address: string;
    coords: GeoPoint;
    nextBuses: Bus[];
}

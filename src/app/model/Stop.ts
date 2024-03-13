import { Bus } from "./Bus";
import { Coordinates } from "./Coordinates";

export interface Stop {
    id: string;
    name: string;
    address: string;
    coords: Coordinates;
    nextBuses: Bus[];
}

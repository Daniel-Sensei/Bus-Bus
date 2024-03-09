import { Bus } from "../Bus";

export const BUSES: Bus[] = [
    {
        id: 1,
        name: 'Bus A',
        lat: 38.97688,
        lon: 16.33111,
        stops: [3, 1, 5],
        lastStop: "Fermata A"
    },

    //cosenza
    {
        id: 2,
        name: 'Bus B',
        lat: 39.36231,
        lon: 16.22758,
        stops: ["Fermata A", "via degli innocenti e della Speranza, 32", "via degli innocenti e della Speranzaa, 3", "Fermata A", "Fermata A", "Fermata A", "Fermata A", "Fermata A", "Fermata A", "Fermata A", "Fermata A", "Fermata A","Fermata A"],
        lastStop: "via degli innocenti e della Speranzaa, 3"
    }
];
import { Stop } from './Stop';

export interface Route {
    id: string;
    company: string;
    code: string; // 138A, 138B, 138C, 138D...
    stops: Stop[]; // Mappa di ID fermata a array di orari previsti
    hours: string[][];
}

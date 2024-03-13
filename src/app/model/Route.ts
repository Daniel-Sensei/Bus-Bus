import { Stop } from './Stop';

export interface Route {
    id: string;
    company: string;
    code: string; // 138A, 138B, 138C, 138D...
    stops: { [stopId: string]: string[] }; // Mappa di ID fermata a array di orari previsti
}

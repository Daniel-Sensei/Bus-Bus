export interface Route {
    id: string;
    company: string;
    code: string; // 138A, 138B, 138C, 138D...
    stops: any;
    hours: string[][];
}

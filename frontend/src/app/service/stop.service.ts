import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StopService {

  readonly API_URL = 'http://localhost:8080/';

  constructor(private http: HttpClient) { }

  getStopsWithinRadius(coords: {latitude: number, longitude: number}, radius: number): Observable<any> {
    return this.http.get(this.API_URL + 'stopsWithinRadius?latitude=' + coords.latitude + '&longitude=' + coords.longitude + '&radius=' + radius);
  }

  getNextBuses(stopId: string): Observable<any> {
    return this.http.get(this.API_URL + 'nextBuses?stopId=' + stopId);
  }
}

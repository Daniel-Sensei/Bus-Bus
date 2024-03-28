import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RouteService {

  readonly API_URL = 'http://localhost:8080/';

  constructor(private http: HttpClient) { }

  getRouteById(id: string) {
    return this.http.get(this.API_URL + 'route?id=' + id);
  }
}

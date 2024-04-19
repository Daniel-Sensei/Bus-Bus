import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RouteService {

  //readonly API_URL = 'http://localhost:8080/';

  constructor(private http: HttpClient) { }

  getRouteById(id: string) {
    return this.http.get(environment.API_URL + 'route?id=' + id);
  }

  getAllRoutes(): Observable<any>{
    return this.http.get(environment.API_URL + 'allRoutes');
  }
}
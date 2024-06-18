import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RouteService {

  constructor(private http: HttpClient) { }

  /**
   * Returns an Observable of the route with the given id by making an HTTP GET request
   * to the API server.
   *
   * @param {string} id - The ID of the route to retrieve.
   * @return {Observable<any>} An Observable of the route with the given id.
   */
  getRouteById(id: string) {
    // Construct the URL for the HTTP GET request
    const url = environment.API_URL + 'route?id=' + id;

    // Perform the HTTP GET request and return an Observable of the response
    return this.http.get(url);
  }

  /**
   * Returns an Observable of all routes by making an HTTP GET request
   * to the API server.
   *
   * @return {Observable<any>} An Observable of all routes.
   */
  getAllRoutes(): Observable<any> {
    // Construct the URL for the HTTP GET request
    // and make the HTTP GET request
    return this.http.get(environment.API_URL + 'allRoutes');
  }
}

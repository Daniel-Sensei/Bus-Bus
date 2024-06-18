import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StopService {

  constructor(private http: HttpClient) { }

  /**
   * Retrieves a stop from the API based on its ID.
   * 
   * @param {string} id - The ID of the stop to retrieve.
   * @return {Observable<any>} An observable that emits the retrieved stop when it is available.
   */
  getStop(id: string): Observable<any> {
    // Construct the URL for the API request by appending the ID parameter to the base API URL
    const url = `${environment.API_URL}stop?id=${id}`;

    // Make the HTTP GET request to the API and return the resulting observable
    return this.http.get(url);
  }

  /**
   * Retrieves stops from the API within a specified radius of a given location.
   *
   * @param {Object} coords - An object containing the latitude and longitude of the location.
   * @param {number} radius - The radius in meters within which to search for stops.
   * @return {Observable<any>} An observable that emits the retrieved stops when they are available.
   */
  getStopsWithinRadius(coords: {latitude: number, longitude: number}, radius: number): Observable<any> {
    // Construct the URL for the API request by appending the latitude, longitude, and radius parameters to the base API URL
    const url = `${environment.API_URL}stopsWithinRadius?latitude=${coords.latitude}&longitude=${coords.longitude}&radius=${radius}`;

    // Make the HTTP GET request to the API and return the resulting observable
    return this.http.get(url);
  }

  /**
   * Retrieves the next buses arriving at a specific stop from the API.
   *
   * @param {string} stopId - The ID of the stop to retrieve the next buses for.
   * @return {Observable<any>} An observable that emits the next buses when they are available.
   */
  getNextBuses(stopId: string): Observable<any> {
    // Construct the URL for the API request by appending the stopId parameter to the base API URL
    const url = `${environment.API_URL}nextBuses?stopId=${stopId}`;

    // Make the HTTP GET request to the API and return the resulting observable
    return this.http.get(url);
  }
}

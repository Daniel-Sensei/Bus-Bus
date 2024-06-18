import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bus } from '../model/Bus';
import { collection } from '@firebase/firestore';
import { Firestore, collectionData } from '@angular/fire/firestore';
import { map, takeUntil  } from 'rxjs/operators';

import { getDatabase, ref } from 'firebase/database';
import { Subject } from 'rxjs';
import { onValue } from 'firebase/database';
import { Position } from '@capacitor/geolocation';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class BusService {

  firebaseDB: any;
  private unsubscribeSubject: Subject<void> = new Subject();

  constructor(
    private http: HttpClient,
    private firestore: Firestore,
  ) {
    this.firebaseDB = getDatabase();
  }

  /**
   * Returns an Observable that emits an array of Bus objects that are within the specified radius
   * from the given position.
   *
   * @param {Position} position - The position from which to calculate the radius.
   * @param {number} radius - The radius in kilometers.
   * @return {Observable<Bus[]>} An Observable that emits an array of Bus objects.
   */
  getBusesWithinRadius(position: Position, radius: number): Observable<Bus[]> {
    // Cancel the previous subscription
    this.unsubscribeSubject.next(); // Clear previous subscription

    // Retrieve bus data from the realtime database and filter it based on the radius
    return this.getBusesFromRealtimeDatabase().pipe(
      takeUntil(this.unsubscribeSubject), // Unsubscribe from the observable when unsubscribeSubject emits
      map(buses => {
        // Filter buses that are within the specified radius from the given position
        return buses.filter(bus => this.isInsideRadius(
          [bus.coords.latitude, bus.coords.longitude], // Coordinates of the bus
          [position.coords.latitude, position.coords.longitude], // Coordinates of the position
          radius
        ));
      })
    );
  }

  /**
   * Checks if a point is within a specified radius from another point.
   *
   * @param {[number, number]} objectCoords - The coordinates of the point to check.
   * @param {[number, number]} currentCoords - The coordinates of the reference point.
   * @param {number} radius - The radius in meters.
   * @return {boolean} True if the point is within the radius, false otherwise.
   */
  isInsideRadius(objectCoords: [number, number], currentCoords: [number, number], radius: number): boolean {
    // Extract latitude and longitude from the coordinates
    const [lat1, lon1] = objectCoords;
    const [lat2, lon2] = currentCoords;

    // Radius of the Earth in kilometers
    const R = 6371;

    // Convert latitude and longitude to radians
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    // Calculate the Haversine formula
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Calculate the distance in kilometers
    const distance = R * c;

    // Check if the distance is within the specified radius
    return distance <= radius/1000; // Convert radius to kilometers
  }

  /**
   * Converts degrees to radians.
   *
   * @param {number} deg - The angle in degrees.
   * @return {number} The angle in radians.
   */
  deg2rad(deg: number): number {
    // Convert degrees to radians
    // by multiplying by Pi and dividing by 180
    return deg * (Math.PI / 180);
  }


  /**
   * Retrieves the list of buses from the real-time database.
   *
   * @return {Observable<Bus[]>} An observable of the list of buses.
   */
  private getBusesFromRealtimeDatabase(): Observable<Bus[]> {
    // Get a reference to the 'buses' path in the real-time database
    const busesRef = ref(this.firebaseDB, 'buses');
    // Create a subject to emit the list of buses
    const subject = new Subject<Bus[]>();

    // Subscribe to the 'buses' path and retrieve the bus data
    onValue(busesRef, (snapshot) => {
      const buses: Bus[] = [];
      // Iterate over each child snapshot (each bus)
      snapshot.forEach(childSnapshot => {
        console.log("Child snapshot (multiple buses): ", childSnapshot);
        // Get the bus data from the snapshot
        const busData = childSnapshot.val();
        // Create a Bus object from the bus data
        const bus: Bus = {
          id: childSnapshot.key,  // Set the bus ID
          coords: busData.coords,  // Set the bus coordinates
          route: busData.route,  // Set the bus route
          routeId: busData.routeId,  // Set the bus route ID
          speed: busData.speed,  // Set the bus speed
          lastStop: busData.lastStop,  // Set the bus last stop
          direction: busData.direction,  // Set the bus direction
        };
        // Add the bus to the list of buses
        buses.push(bus);
      });
      // Emit the list of buses
      subject.next(buses);
    });

    // Return the observable of the list of buses
    return subject.asObservable();
  }

  /**
   * Retrieves a single bus from the real-time database based on its ID.
   *
   * @param {string} busId - The ID of the bus to retrieve.
   * @return {Observable<Bus>} An observable emitting the bus object if found, or null if not found.
   */
  public getBusFromRealtimeDatabase(busId: string): Observable<Bus> {
    // Get a reference to the bus's specific path in the real-time database
    const busRef = ref(this.firebaseDB, `buses/${busId}`);
    // Create a subject to emit the bus object
    const subject = new Subject<Bus>();

    // Subscribe to the bus's path and retrieve the bus data
    onValue(busRef, (snapshot) => {
      console.log("Bus snapshot: ", snapshot);
      // Get the bus data from the snapshot
      const busData = snapshot.val();
      if (busData) {
        // Create a Bus object from the bus data
        const bus: Bus = {
          id: snapshot.key!,  // Set the bus ID
          coords: busData.coords,  // Set the bus coordinates
          route: busData.route,  // Set the bus route
          routeId: busData.routeId,  // Set the bus route ID
          speed: busData.speed,  // Set the bus speed
          lastStop: busData.lastStop,  // Set the bus last stop
          direction: busData.direction,  // Set the bus direction
        };
        // Emit the bus object
        subject.next(bus);
      } else {
        // Emit null if the bus is not found in the database
        subject.next(null as unknown as Bus);
      }
    });

    // Return the observable emitting the bus object
    return subject.asObservable();
  }

  /**
   * Retrieves the next arrivals for a specific bus and direction from the backend API.
   *
   * @param {string} busId - The ID of the bus.
   * @param {string} direction - The direction of travel.
   * @return {Promise<any>} A promise that resolves to the response from the API containing the next arrivals.
   * @throws {any} If an error occurs while making the HTTP request, the error is re-thrown to be handled by the calling component.
   */
  public async getArrivalsByBusAndDirection(busId: string, direction: string): Promise<any> {
    try {
      // Construct the URL for the API request
      const url = `${environment.API_URL}next-arrivals-by-bus-direction?busId=${busId}&direction=${direction}`;

      // Make the HTTP GET request to the API
      const response = await this.http.get(url).toPromise();

      // Return the response from the API
      return response;
    } catch (error) {
      // Rethrow the error to be handled by the calling component
      throw error;
    }
  }

  /**
   * Retrieves the average delay for a specific bus and direction from the backend API.
   *
   * @param {string} busId - The ID of the bus.
   * @param {string} direction - The direction of travel.
   * @return {Promise<any>} A promise that resolves to the response from the API containing the average delay.
   * @throws {any} If an error occurs while making the HTTP request, the error is re-thrown to be handled by the calling component.
   */
  public getAvgDelayByBusAndDirection(busId: string, direction: string): Promise<any> {
    try {
      // Construct the URL for the API request
      const url = `${environment.API_URL}avg-bus-delay?busId=${busId}&direction=${direction}`;

      // Make the HTTP GET request to the API
      return this.http.get(url).toPromise();
    } catch (error) {
      // Rethrow the error to be handled by the calling component
      throw error;
    }
  }

  /**
   * Retrieves the current delay for a specific bus and direction from the backend API.
   *
   * @param {string} busId - The ID of the bus.
   * @param {string} direction - The direction of travel.
   * @return {Promise<any>} A promise that resolves to the response from the API containing the current delay.
   * @throws {any} If an error occurs while making the HTTP request, the error is re-thrown to be handled by the calling component.
   */
  public getCurrentDelayByBusAndDirection(busId: string, direction: string): Promise<any> {
    try {
      // Construct the URL for the API request
      const url = `${environment.API_URL}current-bus-delay?busId=${busId}&direction=${direction}`;

      // Make the HTTP GET request to the API
      return this.http.get(url).toPromise();
    } catch (error) {
      // Rethrow the error to be handled by the calling component
      throw error;
    }
  }
}
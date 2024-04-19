import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bus } from '../model/Bus';
import { collection } from '@firebase/firestore';
import { Firestore, collectionData } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';

import { getDatabase, ref, get } from 'firebase/database';
import { Subject } from 'rxjs';
import { onValue } from 'firebase/database';
import { Position } from '@capacitor/geolocation';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class BusService {

  firebaseDB: any;

  constructor(
    private http: HttpClient,
    private firestore: Firestore, // Inietta AngularFirestore
  ) {
    this.firebaseDB = getDatabase();
  }

  getBusesWithinRadius(position: Position, radius: number): Observable<Bus[]> {
    return this.getBusesFromRealtimeDatabase().pipe(
      map(buses => {
        return buses.filter(bus => this.isInsideRadius(
          [bus.coords.latitude, bus.coords.longitude],
          [position.coords.latitude, position.coords.longitude],
          radius
        ));
      })
    );
  }

  isInsideRadius(objectCoords: [number, number], currentCoords: [number, number], radius: number): boolean {
    const [lat1, lon1] = objectCoords;
    const [lat2, lon2] = currentCoords;

    const R = 6371; // Raggio medio della Terra in chilometri
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distanza in chilometri

    return distance <= radius/1000; // Converto il raggio in chilometri
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }


  private getBusesFromRealtimeDatabase(): Observable<Bus[]> {
    const busesRef = ref(this.firebaseDB, 'buses');
    const subject = new Subject<Bus[]>();

    onValue(busesRef, (snapshot) => {
      const buses: Bus[] = [];
      snapshot.forEach(childSnapshot => {
        const busData = childSnapshot.val();
        const bus: Bus = {
          id: childSnapshot.key,
          coords: busData.coords,
          route: busData.route,
          routeId: busData.routeId,
          speed: busData.speed,
          lastStop: busData.lastStop,
          direction: busData.direction,
          // Aggiungere altri campi se necessario
        };
        buses.push(bus);
      });
      subject.next(buses);
    });

    return subject.asObservable();
  }

  public getBusFromRealtimeDatabase(busId: string): Observable<Bus> {
    const busRef = ref(this.firebaseDB, `buses/${busId}`);
    const subject = new Subject<Bus>();
  
    onValue(busRef, (snapshot) => {
      const busData = snapshot.val();
      if (busData) {
        const bus: Bus = {
          id: snapshot.key!,
          coords: busData.coords,
          route: busData.route,
          routeId: busData.routeId,
          speed: busData.speed,
          lastStop: busData.lastStop,
          direction: busData.direction,
          // Aggiungere altri campi se necessario
        };
        subject.next(bus);
      } else {
        subject.next(null as unknown as Bus); // Emittiamo null se il bus non viene trovato nel database
      }
    });
  
    return subject.asObservable();
  }

  public async getArrivalsByBusAndDirection(busId: string, direction: string): Promise<any> {
    try {
      const response = await this.http.get(environment.API_URL + 'next-arrivals-by-bus-direction?busId=' + busId + '&direction=' + direction).toPromise();
      return response;
    } catch (error) {
      console.error("Errore durante la chiamata HTTP:", error);
      throw error; // Rilancia l'errore per gestirlo nel componente chiamante, se necessario
    }
  }

  public getAvgDelayByBusAndDirection(busId: string, direction: string): Promise<any> {
    try {
      return this.http.get(environment.API_URL + 'avg-bus-delay?busId=' + busId + '&direction=' + direction).toPromise();
    } catch (error) {
      console.error("Errore durante la chiamata HTTP:", error);
      throw error; // Rilancia l'errore per gestirlo nel componente chiamante, se necessario
    }
  }

  public getCurrentDelayByBusAndDirection(busId: string, direction: string): Promise<any> {
    try {
      return this.http.get(environment.API_URL + 'current-bus-delay?busId=' + busId + '&direction=' + direction).toPromise();
    } catch (error) {
      console.error("Errore durante la chiamata HTTP:", error);
      throw error; // Rilancia l'errore per gestirlo nel componente chiamante, se necessario
    }
  }
  


  getAllBuses(): Observable<Bus[]> {
    const busesRef = collection(this.firestore, 'buses');
    return collectionData(busesRef).pipe(
      map((buses: any[]) => {
        //console.log(buses);
        return buses;
      })
    );
  }
}
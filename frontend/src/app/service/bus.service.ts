import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bus } from '../model/Bus';
import { Settings } from '../Settings';
import { collection } from '@firebase/firestore';
import { Firestore, collectionData } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';

import { getDatabase, ref, get } from 'firebase/database';
import { Subject } from 'rxjs';
import { onValue } from 'firebase/database';
import {  Position } from '@capacitor/geolocation';

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
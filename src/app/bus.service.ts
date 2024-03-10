import { Injectable } from '@angular/core';
import { collection } from '@firebase/firestore';
import { Firestore, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Bus } from './model/Bus';

@Injectable({
  providedIn: 'root'
})
export class BusService {

  constructor(private firestore: Firestore) { }

  getBuses(): Observable<Bus[]> {
    const busesRef = collection(this.firestore, 'buses');
    return collectionData(busesRef).pipe(
      map((buses: any[]) => {
        return buses.map(busData => {
          return {
            //id: busData.id, // Assicurati di impostare l'id corretto
            name: busData.name,
            lat: busData.lat,
            lon: busData.lon,
            // Altri campi del modello Bus
          } as Bus;
        });
      })
    );
  }
}

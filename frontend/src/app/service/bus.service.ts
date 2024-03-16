import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bus } from '../model/Bus';
import { Settings } from '../Settings';
import { collection } from '@firebase/firestore';
import { Firestore, collectionData } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';

import { WebSocketService } from './web-socket.service';


@Injectable({
  providedIn: 'root'
})
export class BusService {

  constructor(
    private http: HttpClient,
    private firestore: Firestore, // Inietta AngularFirestore
    private webSocketService: WebSocketService
  ) { }

  /*
  getAllBuses(): Observable<Bus[]> {
    return this.http.get<Bus[]>(Settings.API_ENDPOINT + "api/buses");
  }
  */

  getBuses(latitude: number, longitude: number): Observable<Bus[]> {
    // Invia la tua posizione al server tramite il servizio WebSocket
    this.webSocketService.sendPosition(latitude, longitude);

    // Ritorna l'Observable del servizio WebSocket per ricevere i bus aggiornati
    return this.webSocketService.connect();
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

/*
getAllBuses(): Observable<Bus[]> {
    const busesRef = collection(this.firestore, 'buses');
    return collectionData(busesRef).pipe(
      map((buses: any[]) => {
        console.log(buses);
        return buses;
      })
    );
    */
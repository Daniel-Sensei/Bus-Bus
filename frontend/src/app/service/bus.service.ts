import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bus } from '../model/Bus';
import { Settings } from '../Settings';
import { collection } from '@firebase/firestore';
import { Firestore, collectionData } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class BusService {

  constructor(
    private http: HttpClient,
    private firestore: Firestore // Inietta AngularFirestore
  ) { }

  /*
  getAllBuses(): Observable<Bus[]> {
    return this.http.get<Bus[]>(Settings.API_ENDPOINT + "api/buses");
  }
  */
  

  
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
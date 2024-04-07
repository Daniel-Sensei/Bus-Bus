import { Injectable } from '@angular/core';
import { Position } from '@capacitor/geolocation';

@Injectable({
  providedIn: 'root'
})
export class PositionService {
  currentPosition: Position = {
    coords: {
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      altitude: 0,
      altitudeAccuracy: 0,
      heading: 0,
      speed: 0
    },
    timestamp: 0
  }

  constructor() { }

  setCurrentPosition(lat: number, lng: number) {
    this.currentPosition.coords.latitude = lat;
    this.currentPosition.coords.longitude = lng;
  }

  getCurrentPosition() {
    const position = this.currentPosition;
    this.clearCurrentPosition();
    return position;
  }

  clearCurrentPosition() {
    this.currentPosition = {
      coords: {
        latitude: 0,
        longitude: 0,
        accuracy: 0,
        altitude: 0,
        altitudeAccuracy: 0,
        heading: 0,
        speed: 0
      },
      timestamp: 0
    };
  }
}

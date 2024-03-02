import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';

import { Geolocation, Position } from '@capacitor/geolocation';
import { stops } from '../model/MOCKS/stops_mock';
import { Stop } from '../model/Stop';

import { IonModal } from '@ionic/angular';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {
  map!: L.Map;
  currentPosition!: Position;
  selectedRadius: number = 1000;
  selectedSegment: string = 'default';

  filteredStops: Stop[] = [];

  fermate: string[] = ['Fermata 1', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 6', 'Fermata 7', 'Fermata 1', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 6', 'Fermata 7']; // Lista delle fermate
  autobus: string[] = ['Bus A', 'Bus B', 'Bus C']; // Lista dei bus

  @ViewChild('modal', { static: true }) modal!: IonModal; // Ottieni il riferimento al modal
  @ViewChild('map', { static: true }) mapContainer!: ElementRef; // Ottieni il riferimento al contenitore della mappa


  constructor() {}

  isModalOpen = true;

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  async ngOnInit() {
    await this.initializeDefaultMap();

    this.addModalListeners();
  }

  addModalListeners() {
  this.modal.ionModalDidDismiss.subscribe(() => {
    this.isModalOpen = false;
  });
  }


  async initializeDefaultMap() {
    try {
      this.map = await this.initializeMap();
      await this.getCurrentPosition();
      this.updateMap();
    } catch (error) {
      console.error('Error initializing map', error);
      // Handle error if needed
    }
  }

  async getCurrentPosition() {
    try {
      const permissionStatus = await Geolocation.checkPermissions();
      console.log("Permission status: ", permissionStatus.location);

      if (permissionStatus.location !== 'granted') {
        const requestStatus = await Geolocation.requestPermissions();
        console.log("Permission request: ", requestStatus.location);
        if (requestStatus.location !== 'granted') {
          throw new Error('Permission not granted');
        }
      }

      let options: PositionOptions = {
        maximumAge: 3000,
        timeout: 10000,
        enableHighAccuracy: true
      };
      this.currentPosition = await Geolocation.getCurrentPosition(options);
    } catch (error) {
      console.error('Error getting current position', error);
      throw error;
    }
  }

  initializeMap(): Promise<L.Map> {
    return new Promise((resolve, reject) => {
      const map = L.map('map', {
        center: [42.049, 13.348],
        zoom: 5,
        renderer: L.canvas()
      });

      L.tileLayer('https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=f24f001e33674c629c27b0332728171c', {
        attribution: 'Open Street Map'
      }).addTo(map);

      map.whenReady(() => {
        setTimeout(() => {
          map.invalidateSize();
          resolve(map);
        }, 1000);
      });
    });
  }

  updateMap() {
    const currentPosition = this.currentPosition.coords;
    const currentLatLng = L.latLng(currentPosition.latitude, currentPosition.longitude);

    this.map.flyTo(currentLatLng, 14, {
      duration: 1.5,
      easeLinearity: 0.5
    });

    this.map.once('zoomend', () => {
      this.addMarkerAndCircle(currentLatLng);
      this.addRadiusControl();
      this.addStopsMarkers();
    });
  }

  addMarkerAndCircle(currentLatLng: L.LatLng) {
    const marker = L.circleMarker(currentLatLng, {
      radius: 8,
      color: 'blue',
      fillColor: '#3388ff',
      fillOpacity: 0.8
    }).addTo(this.map);

    const circle = L.circle(currentLatLng, {
      radius: 1000,
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.2
    }).addTo(this.map);
  }

  addRadiusControl() {
    const RadiusControl = L.Control.extend({
      onAdd: () => {
        const buttonDiv = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        buttonDiv.style.display = 'flex';
        buttonDiv.style.borderRadius = '10px';
        buttonDiv.innerHTML = `
          <button id="1" style="background: var(--ion-color-primary); padding: 5px; border-top-left-radius: 8px; border-bottom-left-radius: 8px;" onclick="recenterMap(1000)">1km</button>
          <button id="2" style="padding: 5px;" onclick="recenterMap(2000)">2km</button>
          <button id="5" style="padding: 5px; border-top-right-radius: 8px; border-bottom-right-radius: 8px;" onclick="recenterMap(5000)">5km</button>
        `;
        return buttonDiv;
      },
      onRemove: () => { }
    });

    const recenterButton = new RadiusControl({ position: 'topright' });
    recenterButton.addTo(this.map);

    // Function to recenter the map on current position with a specified radius
    (window as any).recenterMap = (radius: number) => {
      this.selectedRadius = radius;
      this.updateRadiusStyle(radius);
    
      const currentPosition = this.currentPosition.coords;
      const currentLatLng = L.latLng(currentPosition.latitude, currentPosition.longitude);
      this.map.flyTo(currentLatLng, this.calculateZoomLevel(radius), {
        duration: 1,
        easeLinearity: 0.5
      });
    
      // Rimuovi i marker delle fermate attualmente presenti sulla mappa
      this.map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          this.map.removeLayer(layer);
        }
      });
    
      // Aggiorna e aggiungi i marker delle fermate filtrate con il nuovo raggio
      this.addStopsMarkers();
    
      // Rimuovi il cerchio esistente e aggiungi un nuovo cerchio con il raggio specificato
      this.map.eachLayer((layer) => {
        if (layer instanceof L.Circle) {
          this.map.removeLayer(layer);
        }
      });
    
      L.circle(currentLatLng, {
        radius: radius,
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.2
      }).addTo(this.map);
    };
    
  }

  addStopsMarkers() {
    this.filteredStops = stops.filter(stop =>
      this.isInsideRadius([stop.lat, stop.lon], this.currentPosition.coords, this.selectedRadius)
    );

    //this.addRoute();
  
    this.filteredStops.forEach(stop => {
      const customIcon = L.icon({
        iconUrl: 'assets/bus-stop.png', // Assicurati di specificare il percorso corretto del tuo marker personalizzato
        iconSize: [32, 32], // Dimensioni del marker
        iconAnchor: [16, 32], // Posizione del punto di ancoraggio del marker rispetto alla sua posizione
        popupAnchor: [0, -32] // Posizione della finestra di popup rispetto al punto di ancoraggio del marker
      });
  
      L.marker([stop.lat, stop.lon], { icon: customIcon }) // Usa il marker personalizzato
        .bindPopup(stop.name)
        .addTo(this.map);
    });
  }

  // Test function to add a route between two stops (fixed stops for testing purposes)
  addRoute() {
    // Coordinate della fermata 1 e della fermata 3
    const fermata1Coords = L.latLng(38.97635, 16.32999);
    const fermata3Coords = L.latLng(38.97726, 16.33392);
  
    // Aggiungi il controllo di routing alla mappa
    var control = L.Routing.control({
      waypoints: [
        fermata1Coords,
        fermata3Coords
      ],
      routeWhileDragging: true,
      show: false,
      
    }).addTo(this.map);

    // Remove waypoints (of the route) from the map
    this.map.eachLayer((layer: any) => {
      if (layer.options.waypoints && layer.options.waypoints.length) {
        this.map.removeLayer(layer);
       }
    });

    // effettua una query nel DOM per trovare il div  che contiene il controllo di routing
    // nascondi tutti i div che contengono il controllo di routing
    const routingControlDivs = document.querySelectorAll('.leaflet-routing-container');
    routingControlDivs.forEach((div: Element) => {
      (div as HTMLElement).style.display = 'none';
    });
  }
  
  

  isInsideRadius(stopCoords: [number, number], currentCoords: { latitude: number, longitude: number }, radius: number): boolean {
    const stopLatLng = L.latLng(stopCoords[0], stopCoords[1]);
    const currentLatLng = L.latLng(currentCoords.latitude, currentCoords.longitude);
    const distance = stopLatLng.distanceTo(currentLatLng);
    return distance <= radius;
  }

  updateRadiusStyle(radius: number) {
    // Update the style of the buttons based on the selected radius
    const buttons = document.querySelectorAll('button');
    buttons.forEach((button: HTMLButtonElement) => {
      if (parseInt(button.id) === radius / 1000) {
        button.style.background = 'var(--ion-color-primary)';
      } else {
        button.style.background = '';
      }
    });
  }

  
  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }
  

  search(event: CustomEvent) {
    const query = event.detail.value;
    console.log(query);
  }

  calculateZoomLevel(radius: number): number {
    return Math.round(15 - Math.log(radius / 500) / Math.LN2);
  }

  ionViewWillEnter() {
    this.modal.present();
  }

  ionViewWillLeave() {
    this.modal.dismiss();
  }
  
}

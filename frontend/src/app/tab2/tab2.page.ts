import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-measure';
import 'leaflet-geometryutil';

import { Geolocation, Position } from '@capacitor/geolocation';
import { STOPS } from '../model/MOCKS/stops_mock';
import { Stop } from '../model/Stop';
import { Bus } from '../model/Bus';
import { BUSES } from '../model/MOCKS/buses_mock';

import { IonModal } from '@ionic/angular';
import { Router } from '@angular/router';

//import { BusService } from '../bus.service';
import { Coordinates } from '../model/Coordinates';

import { BusService } from '../service/bus.service';
import { GeoPoint } from 'firebase/firestore';

//import { WebSocketService } from '../service/web-socket.service';



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
  filteredBuses: Bus[] = [];

  fermate: string[] = ['Fermata 1', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 6', 'Fermata 7', 'Fermata 1', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 6', 'Fermata 7']; // Lista delle fermate
  autobus: string[] = ['Bus A', 'Bus B', 'Bus C']; // Lista dei bus

  @ViewChild('modal', { static: true }) modal!: IonModal; // Ottieni il riferimento al modal
  @ViewChild('map', { static: true }) mapContainer!: ElementRef; // Ottieni il riferimento al contenitore della mappa

  showStops: boolean = true;
  showBuses: boolean = true;
  selectedStop?: Stop;
  selectedBus?: Bus;

  buses: Bus[] = BUSES;
  firstRoute?: L.Routing.Control = undefined;
  secondRoute?: L.Routing.Control = undefined;

  busMarkers: L.Marker[] = [];


  constructor(
    private router: Router,
    private busService: BusService,
    //private webSocketService: WebSocketService
  ) { }

  isModalOpen = true;

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  async ngOnInit() {
    await this.initializeDefaultMap();

    this.addModalListeners();

    /*
    this.webSocketService.connect().subscribe(
      (message: Bus[]) => {
        //this.buses = message;
        console.log('WebSocket message:', message);
      },
      (error) => {
        console.error('WebSocket error:', error);
      }
    );
    */

    this.busService.getBuses(this.currentPosition.coords.latitude, this.currentPosition.coords.longitude).subscribe(buses => {
      console.log("connected to websocket");
      this.buses = buses;
      this.addBusesMarkers();
    });
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
      //imposta una posizione di default
      this.currentPosition = {
        coords: {
          latitude: 39.3620,
          longitude: 16.2245,
          accuracy: 0,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: 0
      };
      //throw error;
    }
  }

  initializeMap(): Promise<L.Map> {
    return new Promise((resolve, reject) => {
      const map = L.map('map', {
        center: [42.049, 13.348],
        zoom: 5,
        renderer: L.canvas(),
        zoomControl: false // Rimuovi il controllo di zoom predefinito
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
    });

    this.addCustomControls();
    this.addRadiusControl();
    this.addStopsMarkers();
    this.addBusesMarkers();
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

  addCustomControls() {
    // Rimuovi il controllo dello zoom
    //this.map.removeControl(this.map.zoomControl);

    // Aggiungi un nuovo controllo personalizzato per il ricentramento sulla propria posizione
    const recenterButton = L.Control.extend({
      options: {
        position: 'topleft'
      },

      onAdd: () => {
        const buttonDiv = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        buttonDiv.style.backgroundColor = 'white';
        buttonDiv.style.padding = '5px';
        buttonDiv.innerHTML = '<ion-icon aria-hidden="true" name="locate" style="font-size: 20px;"></ion-icon>';
        buttonDiv.title = 'Ricentra sulla tua posizione';
        buttonDiv.onclick = () => {
          this.recenterMap();
        };
        return buttonDiv;
      }
    });

    const recenterControl = new recenterButton();
    this.map.addControl(recenterControl);
  }

  recenterMap() {
    const currentPosition = this.currentPosition.coords;
    const currentLatLng = L.latLng(currentPosition.latitude, currentPosition.longitude);
    this.map.flyTo(currentLatLng, 15, {
      duration: 1.5,
      easeLinearity: 0.5
    });
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
      /*
      this.map.flyTo(currentLatLng, this.calculateZoomLevel(radius), {
        duration: 1,
        easeLinearity: 0.5
      });
      */

      // Rimuovi i marker delle fermate attualmente presenti sulla mappa
      this.map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          this.map.removeLayer(layer);
        }
      });

      // Aggiorna e aggiungi i marker delle fermate filtrate con il nuovo raggio
      this.addStopsMarkers();
      this.addBusesMarkers();

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
    this.filteredStops = STOPS.filter(STOPS =>
      this.isInsideRadius([STOPS.coords.latitude, STOPS.coords.longitude], this.currentPosition.coords, this.selectedRadius)
    );


    //this.addRoute();

    this.filteredStops.forEach(stop => {
      const customIcon = L.icon({
        iconUrl: 'assets/bus-stop-marker.png', // Assicurati di specificare il percorso corretto del tuo marker personalizzato
        iconSize: [32, 32], // Dimensioni del marker
        iconAnchor: [16, 32], // Posizione del punto di ancoraggio del marker rispetto alla sua posizione
        popupAnchor: [0, -32] // Posizione della finestra di popup rispetto al punto di ancoraggio del marker
      });

      L.marker([stop.coords.latitude, stop.coords.longitude], { icon: customIcon }) // Usa il marker personalizzato
        //.bindPopup(stop.name)
        .on('click', () => {
          this.eraseRoute();

          this.navigateToStopDetails(stop); // Aggiunta dell'azione quando clicchi sulla fermata
          this.centerStopBus(stop);
        })
        .addTo(this.map);
    });
  }

  centerStopBus(pos: Stop | Bus) {
    const stopLatLng = L.latLng(pos.coords.latitude, pos.coords.longitude);
    this.map.flyTo(stopLatLng, 15, {
      duration: 1,
      easeLinearity: 0.5
    });
  }

  navigateToStopDetails(stop: Stop) {
    this.showStops = false;

    this.selectedStop = STOPS.find(stopFound => stopFound.id === stop.id);

    //this.router.navigate(['/stop-details', stopId]);
  }

  clearBusMarkers() {
    this.busMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });
  }

  addBusesMarkers() {
    // Ottenere i dati dei bus dal Firestore
    /*
    this.busService.getBuses().subscribe(buses => {
      console.log(buses);
      // Assicurati che i dati dei bus siano filtrati correttamente
      this.filteredBuses = buses.filter(bus =>
        this.isInsideRadius([bus.lat, bus.lon], this.currentPosition.coords, this.selectedRadius)
      );

      this.filteredBuses.forEach(bus => {
        const customIcon = L.icon({
          iconUrl: 'assets/bus-marker.png', // Assicurati di specificare il percorso corretto del tuo marker personalizzato
          iconSize: [32, 32], // Dimensioni del marker
          iconAnchor: [16, 16], // Posizione del punto di ancoraggio del marker rispetto alla sua posizione
          popupAnchor: [0, -16] // Posizione della finestra di popup rispetto al punto di ancoraggio del marker
        });
  
        L.marker([bus.lat, bus.lon], { icon: customIcon }) // Usa il marker personalizzato
          .bindPopup(bus.name)
          .addTo(this.map);
      });

    });
    */

    /*
    this.busService.getAllBuses().subscribe(buses => {
      //console.log(buses);
      this.clearBusMarkers();
      if (this.firstRoute || this.secondRoute) {
        this.eraseRoute();

        //filtra nell'array buses il this.selectedBus

          this.selectedBus = buses.find(bus => bus.id === this.selectedBus?.id);
          if (this.selectedBus) {
            this.drawRoute(this.selectedBus);
          }
        
      }
      */
      
      this.clearBusMarkers();
      if (this.firstRoute || this.secondRoute) {
        this.eraseRoute();

        //filtra nell'array buses il this.selectedBus

          this.selectedBus = this.buses.find(bus => bus.id === this.selectedBus?.id);
          if (this.selectedBus) {
            this.drawRoute(this.selectedBus);
          }
        
      }

      this.filteredBuses = this.buses.filter(BUSES =>
        this.isInsideRadius([BUSES.coords.latitude, BUSES.coords.longitude], this.currentPosition.coords, this.selectedRadius)
      );

      this.filteredBuses.forEach(bus => {
        const customIcon = L.icon({
          iconUrl: 'assets/bus-marker.png', // Assicurati di specificare il percorso corretto del tuo marker personalizzato
          iconSize: [32, 32], // Dimensioni del marker
          iconAnchor: [16, 16], // Posizione del punto di ancoraggio del marker rispetto alla sua posizione
          popupAnchor: [0, -16] // Posizione della finestra di popup rispetto al punto di ancoraggio del marker
        });
  
        const busMarker = L.marker([bus.coords.latitude, bus.coords.longitude], { icon: customIcon }) // Usa il marker personalizzato
          .on('click', () => {
            this.navigateToBusDetails(bus); // Aggiunta dell'azione quando clicchi sulla fermata
            //this.centerStopBus(bus);
            this.eraseRoute();
            this.drawRoute(bus);
            //this.centerStopBus(bus);
          })
          .addTo(this.map);
        this.busMarkers.push(busMarker);
      });
        
        
  
  


  }



  drawRoute(bus: Bus) {
    var position = {
      coords: {
        latitude: bus.coords.latitude,
        longitude: bus.coords.longitude,
        accuracy: 0,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: 0
    };

    const busPosition = position.coords;


    // Creare un array di coordinate dal primo stop all'attuale posizione del bus

    if (bus.lastStop >= 0) {
      const firstLegStops = bus.route.stops.slice(0, bus.lastStop + 1).map(stop => L.latLng(stop.coords.latitude, stop.coords.longitude));

      const firstLegWaypoints = [...firstLegStops, L.latLng(busPosition.latitude, busPosition.longitude)];
      // Aggiungere il controllo di routing alla mappa per il primo percorso (primo stop all'attuale posizione del bus)
      this.firstRoute = L.Routing.control({
        waypoints: firstLegWaypoints,
        lineOptions: {
          styles: [{ color: 'yellow', opacity: 1, weight: 5, dashArray: '10, 10'}],
          extendToWaypoints: true,
          missingRouteTolerance: 100
        },
        routeWhileDragging: true,
        show: false,
        fitSelectedRoutes: false, // Non adattare la mappa al percorso
        //lineOptions: { styles: [{ color: 'yellow', weight: 5 }] } // Imposta il colore del percorso in giallo
      }).addTo(this.map);
    }

    const lastLegStops = bus.route.stops.slice(bus.lastStop + 1).map(stop => L.latLng(stop.coords.latitude, stop.coords.longitude));
    const lastLegWaypoints = [L.latLng(busPosition.latitude, busPosition.longitude), ...lastLegStops];

    // Aggiungere il controllo di routing alla mappa per il secondo percorso (attuale posizione del bus all'ultimo stop)
    this.secondRoute = L.Routing.control({
      waypoints: lastLegWaypoints,
      routeWhileDragging: true,
      show: true,
      //lineOptions: { styles: [{ color: 'red', weight: 5 }] } // Imposta il colore del percorso in rosso
    }).addTo(this.map);

    // Remove waypoints (of the route) from the map
    this.map.eachLayer((layer: any) => {
      if (layer.options.waypoints && layer.options.waypoints.length) {
        this.map.removeLayer(layer);
      }
    });

    // Effettuare una query nel DOM per trovare il div che contiene il controllo di routing
    // Nascondere tutti i div che contengono il controllo di routing
    const routingControlDivs = document.querySelectorAll('.leaflet-routing-container');
    routingControlDivs.forEach(div => {
      (div as HTMLElement).style.display = 'none';
    });
  }

  eraseRoute() {
    // Rimuovere i punti intermedi (waypoints) dei percorsi
    this.map.eachLayer((layer: any) => {
      if (layer.options.waypoints && layer.options.waypoints.length) {
        this.map.removeLayer(layer);
      }
    });

    // Rimuovere i layer dei percorsi stessi
    if (this.firstRoute) {
      this.map.removeControl(this.firstRoute);
      this.firstRoute = undefined;
    }
    if (this.secondRoute) {
      this.map.removeControl(this.secondRoute);
      this.secondRoute = undefined;
    }
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

  navigateToBusDetails(bus: Bus) {
    this.selectedBus = bus;

    this.showBuses = false;
    //this.router.navigate(['/stop-details', stopId]);
  }

  getDistance(pos1: GeoPoint | Position, pos2: GeoPoint) {
    //using leaflet-routing-machine calculate distance between two points
    // return distance in meters without calculating the route, just the distance in air

    //if the first position is a Position object, convert it to a Geopoint object
    if ((pos1 as Position).coords) {
      const positionCoords = (pos1 as Position).coords;
      pos1 = new GeoPoint(positionCoords.latitude, positionCoords.longitude);
    }

    //use leaflet measure
    // Creare due punti Leaflet LatLng
    const point1 = L.latLng((pos1 as GeoPoint).latitude, (pos1 as GeoPoint).longitude);
    const point2 = L.latLng(pos2.latitude, pos2.longitude);

    // Utilizzare il modulo Leaflet Measure per calcolare la distanza tra i due punti
    const distance = L.GeometryUtil.length([point1, point2]);

    // Calcola la distanza in chilometri
    const distanceInKilometers = distance / 1000;

    // Arrotonda la distanza a una cifra decimale
    const roundedDistance = distanceInKilometers.toFixed(1);

    // Ritorna la distanza arrotondata
    return Number(roundedDistance);

  }

}

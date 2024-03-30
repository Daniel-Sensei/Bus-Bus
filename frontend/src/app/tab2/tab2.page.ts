import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-measure';
import 'leaflet-geometryutil';

import { Geolocation, Position } from '@capacitor/geolocation';
import { Stop } from '../model/Stop';
import { Bus } from '../model/Bus';

import { IonModal } from '@ionic/angular';

import { BusService } from '../service/bus.service';
import { GeoPoint } from 'firebase/firestore';
import { RouteService } from '../service/route.service';
import { StopService } from '../service/stop.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {
  map!: L.Map;
  currentPosition!: Position;
  selectedRadius: number = 1000;
  selectedSegment: string = 'default'; //stops and buses

  // Array di fermate filtrate in base al raggio selezionato
  filteredStops: Stop[] = [];
  nextBuses: any;
  filteredBuses: Bus[] = [];

  @ViewChild('modal', { static: true }) modal!: IonModal; // Ottieni il riferimento al modal
  @ViewChild('map', { static: true }) mapContainer!: ElementRef; // Ottieni il riferimento al contenitore della mappa

  showStops: boolean = true;
  showBuses: boolean = true;
  selectedStop?: Stop;
  selectedBus?: Bus;

  buses: Bus[] = [];
  firstRoute?: L.Routing.Control = undefined;
  secondRoute?: L.Routing.Control = undefined;

  busMarkers: L.Marker[] = [];
  isModalOpen = true;
  busesDetailsLoaded: boolean = false;

  constructor(
    private busService: BusService,
    private routeService: RouteService,
    private stopService: StopService
  ) { }

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

  initializeMap(): Promise<L.Map> {
    return new Promise((resolve, reject) => {
      const map = L.map('map', {
        center: [42.049, 13.348], // Posizione iniziale della mappa (Italy)
        zoom: 5,
        renderer: L.canvas(),
        zoomControl: false // Rimuovi il controllo di zoom predefinito
      });

      L.tileLayer('https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=f24f001e33674c629c27b0332728171c', {
        attribution: 'Open Street Map'
      }).addTo(map);

      //used to fix the map not showing correctly when moving
      map.whenReady(() => {
        setTimeout(() => {
          map.invalidateSize();
          resolve(map);
        }, 1000);
      });
    });
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
      console.log("DEFAULT POSITION");
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
    // Aggiungi un nuovo controllo personalizzato per il ricentramento sulla propria posizione
    //GPS BUTTON
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
    this.stopService.getStopsWithinRadius({ latitude: this.currentPosition.coords.latitude, longitude: this.currentPosition.coords.longitude }, this.selectedRadius).subscribe(stops => {
      //stops are order by the server
      this.filteredStops = stops;

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
            this.eraseRoute(); // Rimuovi i percorsi esistenti dalla mappa

            this.navigateToStopDetails(stop); // Aggiunta dell'azione quando clicchi sulla fermata
            this.centerStopBus(stop);
          })
          .addTo(this.map);
      });

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
    if (stop) {
      this.stopService.getNextBuses(stop.id).subscribe((buses) => {
        this.showStops = false;
        this.showBuses = true;

        this.selectedStop = this.filteredStops.find(stopFound => stopFound.id === stop.id);
        // Inizializza un array per contenere tutte le coppie di linee e orari
        this.nextBuses = [];

        // Itera su tutte le chiavi dell'oggetto (che rappresentano i nomi delle linee)
        Object.keys(buses).forEach(line => {
          buses[line].forEach((time: any) => {
            this.nextBuses.push(`${line}?${time}`);
          });
        });

        //splitta la stringa in due parti
        this.nextBuses = this.nextBuses.map((item: string) => {
          const [line, time] = item.split('?');
          return { line, time };
        });

        //splitta ulteriormente line.code e line.name per "_"
        this.nextBuses = this.nextBuses.map((item: any) => {
          const [code, name] = item.line.split('_');
          return { code, name, time: item.time };
        });

        // Ordina la lista risultante per orario
        this.nextBuses.sort((a: any, b: any) => {
          return a.time.localeCompare(b.time);
        });

        // Stampa la lista risultante
        this.nextBuses.forEach((item: string) => {
          console.log(item);
        });
      });
    }
  }

  addBusesMarkers() {
    //UPDATE BUSES (REMOVE OLD MARKERS AND ADD NEW ONES)
    this.clearBusMarkers();
    //REMOVE ROUTE IF EXISTS
    if (this.firstRoute || this.secondRoute) {
      this.eraseRoute();
      //filtra nell'array buses il this.selectedBus
      this.selectedBus = this.filteredBuses.find(bus => bus.id === this.selectedBus?.id);
      //Redraw route if selectedBus is not null
      if (this.selectedBus) {
        this.drawRoute(this.selectedBus);
      }
    }

    this.busService.getBusesWithinRadius(this.currentPosition, this.selectedRadius).subscribe(buses => {
      this.filteredBuses = buses;
      console.log(this.filteredBuses);
      if (this.filteredBuses.length != this.buses.length) {
        console.log("GETTING ROUTES");
        this.buses = this.filteredBuses;
        let cont = 0;
        this.buses.forEach(bus => {
          if (bus.route == undefined) {
            this.routeService.getRouteById(bus.routeId).subscribe((route: any) => {
              console.log(route);
              bus.route = route;
              cont++;
              if (cont == this.buses.length) {
                this.busesDetailsLoaded = true;
                console.log("ROUTES LOADED");
              }
            });
          }
        });
      }

      /*
      this.filteredBuses = this.buses.filter(BUSES =>
        this.isInsideRadius([BUSES.coords.latitude, BUSES.coords.longitude], this.currentPosition.coords, this.selectedRadius)
      );
      */

      this.filteredBuses.forEach(bus => {
        const customIcon = L.icon({
          iconUrl: 'assets/bus-marker.png', // Assicurati di specificare il percorso corretto del tuo marker personalizzato
          iconSize: [32, 32], // Dimensioni del marker
          iconAnchor: [16, 16], // Posizione del punto di ancoraggio del marker rispetto alla sua posizione
          popupAnchor: [0, -16] // Posizione della finestra di popup rispetto al punto di ancoraggio del marker
        });

        const busMarker = L.marker([bus.coords.latitude, bus.coords.longitude], { icon: customIcon }) // Usa il marker personalizzato
          .on('click', () => {
            this.navigateToBusDetails(bus.routeId); // Aggiunta dell'azione quando clicchi sulla fermata
            //this.centerStopBus(bus);
            this.eraseRoute();
            //this.drawRoute(bus);
          })
          .addTo(this.map);
        this.busMarkers.push(busMarker);
      });

    });

  }

  navigateToBusDetails(busRouteId: string) {
    this.buses.forEach(bus => {
      if (bus.routeId === busRouteId) {
        this.selectedBus = bus;
        console.log(this.selectedBus);
        this.showBuses = false;
        this.showStops = true;
        return;
      }
    });
  }

  clearBusMarkers() {
    this.busMarkers.forEach(marker => {
      this.map.removeLayer(marker);
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
      const firstLegStops = bus.route.stops.slice(0, bus.lastStop + 1).map((stop: any) => L.latLng(stop.coords.latitude, stop.coords.longitude));

      const firstLegWaypoints = [...firstLegStops, L.latLng(busPosition.latitude, busPosition.longitude)];
      // Aggiungere il controllo di routing alla mappa per il primo percorso (primo stop all'attuale posizione del bus)
      this.firstRoute = L.Routing.control({
        waypoints: firstLegWaypoints,
        lineOptions: {
          styles: [{ color: 'yellow', opacity: 1, weight: 5, dashArray: '10, 10' }],
          extendToWaypoints: true,
          missingRouteTolerance: 100
        },
        routeWhileDragging: true,
        show: false,
        fitSelectedRoutes: false, // Non adattare la mappa al percorso
        //lineOptions: { styles: [{ color: 'yellow', weight: 5 }] } // Imposta il colore del percorso in giallo
      }).addTo(this.map);
    }

    const lastLegStops = bus.route.stops.slice(bus.lastStop + 1).map((stop: any) => L.latLng(stop.coords.latitude, stop.coords.longitude));
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

  isInsideRadius(objectCoords: [number, number], currentCoords: { latitude: number, longitude: number }, radius: number): boolean {
    const stopLatLng = L.latLng(objectCoords[0], objectCoords[1]);
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

  calculateZoomLevel(radius: number): number {
    return Math.round(15 - Math.log(radius / 500) / Math.LN2);
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

  search(event: CustomEvent) {
    const query = event.detail.value;
    console.log(query);
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  ionViewWillEnter() {
    this.modal.present();
  }

  ionViewWillLeave() {
    this.modal.dismiss();
  }

}

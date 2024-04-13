import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-measure';
import 'leaflet-geometryutil';
import 'leaflet-control-geocoder';

import { OpenStreetMapProvider } from 'leaflet-geosearch';

const provider = new OpenStreetMapProvider();

import { Geolocation, Position } from '@capacitor/geolocation';
import { Stop } from '../model/Stop';
import { Bus } from '../model/Bus';

import { IonModal } from '@ionic/angular';

import { BusService } from '../service/bus.service';
import { GeoPoint } from 'firebase/firestore';
import { RouteService } from '../service/route.service';
import { StopService } from '../service/stop.service';

import { PositionService } from '../service/position.service';
import { PreferencesService } from '../service/preferences.service';

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
  @ViewChild('cardModal', { static: true }) cardModal!: IonModal; // Ottieni il riferimento al modal
  @ViewChild('map', { static: true }) mapContainer!: ElementRef; // Ottieni il riferimento al contenitore della mappa

  showStops: boolean = true;
  showBuses: boolean = true;
  selectedStop?: Stop;
  selectedBus?: Bus;

  buses: Bus[] = [];
  firstRoute?: L.Routing.Control = undefined;
  secondRoute?: L.Routing.Control = undefined;

  busesMarkers: L.Marker[] = [];
  stopsMarkers: L.Marker[] = [];
  isModalOpen = true;
  busesDetailsLoaded: boolean = false;

  //
  places: any[] = [];
  isComponentLoaded: boolean = false;
  drawMarker: boolean = true;


  constructor(
    private busService: BusService,
    private routeService: RouteService,
    private stopService: StopService,
    private positionService: PositionService,
    private preferencesService: PreferencesService
  ) { }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  presentingElement: Element | null = null;

  async ngOnInit() {
    console.log("INITIALIZING TAB2");
    this.presentingElement = document.querySelector('.ion-page');

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

      let position = this.positionService.getCurrentPosition();
      console.log("POSITION: ", position);
      if (position.coords.latitude == 0 && position.coords.longitude == 0) {
        console.log("POSITION NOT SET");
        await this.getCurrentPosition();
      }
      else {
        console.log("POSITION SET");
        this.currentPosition = position;
        this.drawMarker = false;
      }

      this.addTopBar();
      this.addTopBarListner();
      this.updateMap();
    } catch (error) {
      console.error('Error initializing map', error);
      // Handle error if needed
    }
  }

  initializeMap(): Promise<L.Map> {
    return new Promise((resolve, reject) => {
      const map = L.map('map', {
        center: [39.229, 12.810], // Posizione iniziale della mappa (Italy)
        zoom: 5,
        renderer: L.canvas(),
        zoomControl: false // Rimuovi il controllo di zoom predefinito
      });

      L.tileLayer('https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=f24f001e33674c629c27b0332728171c', { //transport
        attribution: 'Open Street Map',
        className: 'map-tiles'
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

    this.showStops = true;
    this.showBuses = true;

    this.addStopsMarkers();
    this.addBusesMarkers();
  }

  addTopBar() {
    const TopBarControl = L.Control.extend({
      onAdd: () => {
        const topBarDiv = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        topBarDiv.style.width = '100%'; // Imposta la larghezza al 100%
        topBarDiv.style.display = 'flex'; // Usa flexbox per allineare il contenuto al centro
        //topBarDiv.style.marginLeft = "50%"; // Sposta il controllo a sinistra di 100px per centrarlo correttamente
        topBarDiv.style.border = '0px'; // Aggiungi un bordo al controllo
        topBarDiv.innerHTML = `
                <div style="display: flex; height: 40px; justify-content: center; align-items: center; border-radius: 10px; width: 100%; background-color: var(--background); margin-top: 10px;">
                    <div style="height: 100%; display: flex; align-items: center; border-right: solid 1px; border-color: var(--ion-color-step-600, #999999);">
                        <button style="margin-left: 10px; padding-right: 7px; background-color: transparent;" onclick="recenterMap()">
                        <ion-icon aria-hidden="true" name="locate" style="font-size: 20px; background-color: transparent;">
                        </ion-icon></button>
                    </div>

                    <div style="display: flex; border-right: solid 1px; height: 100%; align-items: center; width: 100%; border-color: var(--ion-color-step-600, #999999);">
                        <ion-icon aria-hidden="true" name="search-outline" style="font-size: 20px; background-color: transparent; margin-left: 7px; margin-right: 3px;"></ion-icon>
                        <input id="searchInput" readonly onclick="openCardModal()" type="text" placeholder="Cerca sulla mappa" style="width: 100%; height: 90%; border: 0; background-color: transparent; font-weight:bold;">
                        </div>

                    <div style="display: flex; height: 100%;">
                        <button id="1" style="background: var(--ion-color-primary); border: 0; border-right: solid 1px; padding-left: 15px; padding-right: 15px; font-weight: bold; border-color: var(--ion-color-step-600, #999999);" onclick="updateRadius(1000)">1</button>
                        <button id="2" style="border: 0; background-color: transparent; border-right: solid 1px; padding-left: 15px; padding-right: 15px; font-weight: bold; border-color: var(--ion-color-step-600, #999999);" onclick="updateRadius(2000)">2</button>
                        <button id="5" style="border: 0; background-color: transparent; padding-left: 15px; padding-right: 15px; border-top-right-radius: 10px; border-bottom-right-radius: 10px; font-weight: bold;" onclick="updateRadius(5000)">5</button>
                    </div>
                </div>
            `;

        // Modifica lo stile del genitore di topBarDiv
        const parentDiv = document.querySelector('.leaflet-top.leaflet-right') as HTMLElement;
        if (parentDiv) {
          parentDiv.style.left = '0'; // Allinea il controllo a sinistra
          parentDiv.style.paddingLeft = '6.5%'; // Aggiungi un padding a sinistra
          parentDiv.style.paddingRight = '2%'; // Aggiungi un padding a destra
        }


        return topBarDiv;
      },
      onRemove: () => { }
    });

    const topBarControl = new TopBarControl({ position: 'topright' });
    topBarControl.addTo(this.map);
  }


  addMarkerAndCircle(currentLatLng: L.LatLng) {

    /*
    const myMarker = L.icon({
      iconUrl: 'assets/my-marker.png', // Assicurati di specificare il percorso corretto del tuo marker personalizzato
      iconSize: [20, 20], // Dimensioni del marker
      iconAnchor: [10, 20], // Posizione del punto di ancoraggio del marker rispetto alla sua posizione
    });
    */

    //L.marker(currentLatLng, { icon: myMarker }).addTo(this.map);


    //clear marker and circle if exists
    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.CircleMarker) {
        this.map.removeLayer(layer);
      }
    });


    if (this.drawMarker) {
      const marker = L.circleMarker(currentLatLng, {
        radius: 8,
        color: '#f0bc5e',
        fillColor: '#f0bc5e',
        fillOpacity: 0.6,
      }).addTo(this.map);
    }

    const circle = L.circle(currentLatLng, {
      radius: this.selectedRadius,
      color: '#f0bc5e',
      fillColor: '#f0bc5e',
      fillOpacity: 0.2,
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
          this.updateRadius();
        };
        return buttonDiv;
      }
    });

    const recenterControl = new recenterButton();
    this.map.addControl(recenterControl);
  }

  updateRadius() {
    const currentPosition = this.currentPosition.coords;
    const currentLatLng = L.latLng(currentPosition.latitude, currentPosition.longitude);
    this.map.flyTo(currentLatLng, 15, {
      duration: 1.5,
      easeLinearity: 0.5
    });
  }

  addTopBarListner() {
    (window as any).openCardModal = () => {
      this.cardModal.present();
    }

    (window as any).recenterMap = async () => {
      await this.getCurrentPosition();
      this.drawMarker = true;
      this.updateMap();
      const currentPosition = this.currentPosition.coords;
      const currentLatLng = L.latLng(currentPosition.latitude, currentPosition.longitude);
      this.map.flyTo(currentLatLng, this.calculateZoomLevel(this.selectedRadius), {
        duration: 1,
        easeLinearity: 0.5
      });
    }

    // Function to recenter the map on current position with a specified radius
    (window as any).updateRadius = (radius: number = this.selectedRadius) => {
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
        color: '#f0bc5e',
        fillColor: '#f0bc5e',
        fillOpacity: 0.2
      }).addTo(this.map);
    };

  }

  clearStopsMarkers() {
    this.stopsMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });
  }

  addStopsMarkers() {
    this.clearStopsMarkers();

    this.stopService.getStopsWithinRadius({ latitude: this.currentPosition.coords.latitude, longitude: this.currentPosition.coords.longitude }, this.selectedRadius).subscribe(stops => {
      //stops are order by the server
      this.filteredStops = stops;

      this.filteredStops.forEach(stop => {
        const customIcon = L.icon({
          iconUrl: this.getIconDirectory() + 'bus-stop-marker.png', // Assicurati di specificare il percorso corretto del tuo marker personalizzato
          iconSize: [16, 16], // Dimensioni del marker
          iconAnchor: [8, 16], // Posizione del punto di ancoraggio del marker rispetto alla sua posizione
          popupAnchor: [0, -16] // Posizione della finestra di popup rispetto al punto di ancoraggio del marker
        });

        const stopMarker = L.marker([stop.coords.latitude, stop.coords.longitude], { icon: customIcon }) // Usa il marker personalizzato
          //.bindPopup(stop.name)
          .on('click', () => {
            this.eraseRoute(); // Rimuovi i percorsi esistenti dalla mappa

            this.navigateToStopDetails(stop); // Aggiunta dell'azione quando clicchi sulla fermata
            this.centerStopBus(stop);
          })
          .addTo(this.map);
        this.stopsMarkers.push(stopMarker);
      });

    });
  }

  centerStopBus = async (pos: Stop | Bus) => {
    //se il breakpoint del modal è 1, allora imposta il breakpoint a 0.30
    if (await this.modal.getCurrentBreakpoint() === 1) {
      this.modal.setCurrentBreakpoint(0.30);
    }

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
    this.buses = [];
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

      this.clearBusMarkers();

      this.filteredBuses.forEach(bus => {
        const customIcon = L.icon({
          iconUrl: this.getIconDirectory() + 'bus-marker.png', // Assicurati di specificare il percorso corretto del tuo marker personalizzato
          iconSize: [22, 22], // Dimensioni del marker
          iconAnchor: [11, 11], // Posizione del punto di ancoraggio del marker rispetto alla sua posizione
          popupAnchor: [0, -11] // Posizione della finestra di popup rispetto al punto di ancoraggio del marker
        });

        const busMarker = L.marker([bus.coords.latitude, bus.coords.longitude], { icon: customIcon }) // Usa il marker personalizzato
          .on('click', () => {
            this.navigateToBusDetails(bus.routeId); // Aggiunta dell'azione quando clicchi sulla fermata
            this.centerStopBus(bus);
            this.eraseRoute();
            //this.drawRoute(bus);
          })
          .addTo(this.map);
        this.busesMarkers.push(busMarker);
      });

    });

  }

  getIconDirectory(): string {
    // Controlla se il tema preferito dall'utente è scuro o chiaro
    const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Restituisci il percorso dell'immagine in base al tema
    return isDarkTheme ? 'assets/dark/' : 'assets/light/';
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
    this.busesMarkers.forEach(marker => {
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
    //find bus in this.buses
    bus = this.buses.find(b => b.id === bus.id) as Bus;
    console.log("DRAW ROUTE: ", bus);

    let stops: any[] = [];
    if (bus.direction === "forward") {
      stops = bus.route.stops.forwardStops;
    }
    else {
      stops = bus.route.stops.backStops;
    }

    stops.forEach(stop => {
      const customIcon = L.icon({
        iconUrl: this.getIconDirectory() + 'bus-stop-marker.png', // Assicurati di specificare il percorso corretto del tuo marker personalizzato
        iconSize: [16, 16], // Dimensioni del marker
        iconAnchor: [8, 16], // Posizione del punto di ancoraggio del marker rispetto alla sua posizione
        popupAnchor: [0, -16] // Posizione della finestra di popup rispetto al punto di ancoraggio del marker
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

    // Creare un array di coordinate dal primo stop all'attuale posizione del bus
    if (bus.lastStop >= 0) {
      const firstLegStops = stops.slice(0, bus.lastStop + 1).map((stop: any) => L.latLng(stop.coords.latitude, stop.coords.longitude));

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

    const lastLegStops = stops.slice(bus.lastStop + 1).map((stop: any) => L.latLng(stop.coords.latitude, stop.coords.longitude));
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
        button.style.background = 'transparent';
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
    console.log("ION WILL ENTER");
    this.modal.present();
  }

  ionViewDidEnter() {
    console.log("ION DID ENTER");
    let position = this.positionService.getCurrentPosition();
    if (position.coords.latitude != 0 && position.coords.longitude != 0) {
      //aspetta che il componente sia caricato al 100%
      setTimeout(() => {
        this.currentPosition = position;
        this.drawMarker = false;
        this.updateMap();
      }, 1000);

    }
  }

  ionViewWillLeave() {
    this.modal.dismiss();
  }

  searchPlaces(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    console.log(query);
    this.searchAddress(query);
  }

  async searchAddress(query: string) {
    if (query && query.length > 0) {
      const results = await provider.search({ query: query });
      //console.log(results);
      this.places = results.map(result => {
        return {
          name: result.label,
          lat: result.y,
          lng: result.x
        };
      });
      console.log(this.places);
    }
  }

  changeCurrentPosition(name: string, lat: number, lng: number) {
    if (name != '') {
      this.preferencesService.addToFavorites('recentSearches', lat + ',' + lng + '_' + name);
    }

    this.currentPosition.coords.latitude = lat;
    this.currentPosition.coords.longitude = lng;
    this.cardModal.dismiss();
    this.drawMarker = false;
    this.updateMap();
  }

  focusInput() {
    setTimeout(() => {
      const input = document.querySelector('ion-input') as HTMLIonInputElement;
      input.setFocus();
    }, 0); // 500 milliseconds di ritardo per garantire che il modal sia completamente aperto
  }


}

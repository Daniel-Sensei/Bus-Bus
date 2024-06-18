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
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss']
})
export class MapPage implements OnInit {
  map!: L.Map;
  currentPosition!: Position;
  selectedRadius: number = 1000;
  selectedSegment: string = 'default'; // "default" for stops and "segment" for buses

  // Filtered Stops and Buses based on specified radius
  filteredStops: Stop[] = [];
  loadedStops: boolean = false;
  loadedBuses: boolean = false;

  nextBuses: any;
  filteredBuses: Bus[] = [];

  @ViewChild('modal', { static: true }) modal!: IonModal; // Content MODAL
  @ViewChild('cardModal', { static: true }) cardModal!: IonModal; // Search MODAL
  @ViewChild('map', { static: true }) mapContainer!: ElementRef; // MAP

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

  places: any[] = [];
  isComponentLoaded: boolean = false;
  drawMarker: boolean = true;
  onInit: boolean = false;

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
    this.presentingElement = document.querySelector('.ion-page');

    await this.initializeDefaultMap();

    this.addModalListeners();

    this.onInit = true;
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
      if (position.coords.latitude == 0 && position.coords.longitude == 0) {
        await this.getCurrentPosition();
      }
      else {
        this.currentPosition = position;
        this.drawMarker = false;
      }

      this.addTopBar();
      this.addTopBarListner();
      this.updateMap();
    } catch (error) {
      console.error('Error initializing map', error);
    }
  }

  initializeMap(): Promise<L.Map> {
    return new Promise((resolve, reject) => {
      const map = L.map('map', {
        center: [39.229, 12.810], // Italy
        zoom: 5,
        renderer: L.canvas(),
        zoomControl: false // Remove zoom control
      });

      L.tileLayer('https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=f24f001e33674c629c27b0332728171c', {
        attribution: 'Open Street Map',
        className: 'map-tiles'
      }).addTo(map);

      // Used to fix the map not showing correctly while moving
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

      if (permissionStatus.location !== 'granted') {
        const requestStatus = await Geolocation.requestPermissions();
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
      // Set default position, UNICAL
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
    }
  }

  /**
   * Updates the map to the current position and adds markers and a circle.
   *
   * This function retrieves the current position, calculates the latitude and longitude,
   * and then uses the Leaflet library to fly the map to the current position with a zoom level of 14.
   * After the map has finished zooming, it adds a marker and a circle to the map.
   * It also sets the visibility of stops and buses to true.
   * Finally, it adds markers for stops and buses to the map.
   */
  updateMap() {
    // Retrieve the current position
    const currentPosition = this.currentPosition.coords;
    // Calculate the latitude and longitude
    const currentLatLng = L.latLng(currentPosition.latitude, currentPosition.longitude);

    // Fly the map to the current position with a zoom level of 14
    this.map.flyTo(currentLatLng, 14, {
      duration: 1.5,
      easeLinearity: 0.5
    });

    // Add a marker and a circle to the map after the map has finished zooming
    this.map.once('zoomend', () => {
      this.addMarkerAndCircle(currentLatLng);
    });

    // Set the visibility of stops and buses to true
    this.showStops = true;
    this.showBuses = true;

    // Add markers for stops and buses to the map
    this.addStopsMarkers();
    this.addBusesMarkers();
  }

  addTopBar() {
    const TopBarControl = L.Control.extend({
      onAdd: () => {
        const topBarDiv = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        topBarDiv.style.width = '100%';
        topBarDiv.style.display = 'flex'; // Used to center the control
        topBarDiv.style.border = '0px'; // Remove the border
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

        const parentDiv = document.querySelector('.leaflet-top.leaflet-right') as HTMLElement;
        if (parentDiv) {
          parentDiv.style.left = '0';
          parentDiv.style.paddingLeft = '6.5%';
          parentDiv.style.paddingRight = '2%';
        }
        return topBarDiv;
      },
      onRemove: () => { }
    });

    const topBarControl = new TopBarControl({ position: 'topright' });
    topBarControl.addTo(this.map);
  }


  addMarkerAndCircle(currentLatLng: L.LatLng) {
    // Clear marker and circle if exists
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

      // Remove existing markers and circles
      this.map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          this.map.removeLayer(layer);
        }
      });

      this.addStopsMarkers();
      this.addBusesMarkers();

      // Remove existing circles and add new ones
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
    this.loadedStops = false;

    this.stopService.getStopsWithinRadius({ latitude: this.currentPosition.coords.latitude, longitude: this.currentPosition.coords.longitude }, this.selectedRadius).subscribe(stops => {
      // Stops are already sorted by distance from the the server
      this.filteredStops = stops;
      this.loadedStops = true;

      this.filteredStops.forEach(stop => {
        const customIcon = L.icon({
          iconUrl: this.getIconDirectory() + 'bus-stop-marker.png',
          iconSize: [16, 16], // Marker size
          iconAnchor: [8, 16], // Anchor position of the marker relative to its position
          popupAnchor: [0, -16] // Anchor position of the popup relative to its anchor
        });

        const stopMarker = L.marker([stop.coords.latitude, stop.coords.longitude], { icon: customIcon })
          .on('click', () => {
            this.eraseRoute(); // Remove existing route if exists
            this.navigateToStopDetails(stop);
            this.centerStopBus(stop.coords.latitude, stop.coords.longitude);
          })
          .addTo(this.map);
        this.stopsMarkers.push(stopMarker);
      });

    });
  }

  centerStopBus = async (lat: number, long: number) => {
    // Set modal breakpoint to 0.30 if it's 1
    if (await this.modal.getCurrentBreakpoint() === 1) {
      this.modal.setCurrentBreakpoint(0.30);
    }

    const stopLatLng = L.latLng(lat, long);
    this.map.flyTo(stopLatLng, 15, {
      duration: 1,
      easeLinearity: 0.5
    });
  }

  centerBus = async (bus: Bus) => {
    // Set modal breakpoint to 0.30 if it's 1
    if (await this.modal.getCurrentBreakpoint() === 1) {
      this.modal.setCurrentBreakpoint(0.30);
    }

    // Find the bus in filteredBuses and take the coords
    const busIndex = this.filteredBuses.findIndex(busFound => busFound.id === bus.id);
    const busCoords = this.filteredBuses[busIndex].coords;


    const stopLatLng = L.latLng(busCoords.latitude, busCoords.longitude);
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
        // Array used to store the next buses
        this.nextBuses = [];

        // Keys rapresent the line names
        Object.keys(buses).forEach(line => {
          buses[line].forEach((time: any) => {
            this.nextBuses.push(`${line}?${time}`);
          });
        });

        // Split the string in two parts: line and time
        this.nextBuses = this.nextBuses.map((item: string) => {
          const [line, time] = item.split('?');
          return { line, time };
        });

        // Split again line.code and line.name
        this.nextBuses = this.nextBuses.map((item: any) => {
          const [code, name] = item.line.split('_');
          return { code, name, time: item.time };
        });

        // Reorder the buses by time
        this.nextBuses.sort((a: any, b: any) => {
          return a.time.localeCompare(b.time);
        });
      });
    }
  }

  /* NOT USED, takes the average delay from the server from the "delays" */
  getAvgBusDelay(busId: string, direction: string) {
    this.busService.getAvgDelayByBusAndDirection(busId, direction).then((response) => {
      if (response > 0) {
        return ("+" + response + " min");
      }
      else {
        return ("-" + response + " min");
      }
    }, (error) => {
      // Not Available
      return "N/A";
    });
  }

  addBusesMarkers() {
    //UPDATE BUSES (REMOVE OLD MARKERS AND ADD NEW ONES)
    this.clearBusMarkers();
    this.buses = [];
    this.busesDetailsLoaded = false;
    this.loadedBuses = false;
    //REMOVE ROUTE IF EXISTS
    if (this.firstRoute || this.secondRoute) {
      this.eraseRoute();
      this.selectedBus = this.filteredBuses.find(bus => bus.id === this.selectedBus?.id);
      //Redraw route if selectedBus is not null
      if (this.selectedBus) {
        this.drawRoute(this.selectedBus);
      }
    }

    // Stop the loading animation
    this.loadedBuses = true;

    // Get the buses within the selected radius
    this.busService.getBusesWithinRadius(this.currentPosition, this.selectedRadius).subscribe(buses => {
      this.filteredBuses = buses;

      // If the filtered buses are different from the current buses, update the buses
      if (this.filteredBuses.length != this.buses.length) {
        this.buses = this.filteredBuses;

        // Initialize a counter to keep track of the number of buses with missing data
        let cont = 0;

        // Iterate over each bus
        this.buses.forEach(bus => {

          // If the bus route is not defined, get it from the server
          if (bus.route == undefined) {
            this.routeService.getRouteById(bus.routeId).subscribe((route: any) => {
              bus.route = route;
              cont++;

              // If all the buses have their route, mark the bus details as loaded
              if (cont == this.buses.length) {
                this.busesDetailsLoaded = true;
              }
            });
          }

          // If the bus delay is not defined, get it from the server
          if (bus.delay == undefined) {
            this.busService.getCurrentDelayByBusAndDirection(bus.id, bus.direction).then((response) => {
              if (response >= 0) {
                bus.delay = "+" + response + " min";
              }
              else {
                bus.delay = response + " min";
              }
            }, (error) => {
              bus.delay = "N/A";
            });
          }
        });
      }

      // REDRAW THE MARKERS
      this.clearBusMarkers();

      this.filteredBuses.forEach(bus => {
        const customIcon = L.icon({
          iconUrl: this.getIconDirectory() + 'bus-marker.png',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          popupAnchor: [0, -11]
        });

        const busMarker = L.marker([bus.coords.latitude, bus.coords.longitude], { icon: customIcon }) // Usa il marker personalizzato
          .on('click', () => {
            this.navigateToBusDetails(bus.routeId);
            this.centerStopBus(bus.coords.latitude, bus.coords.longitude);
            this.eraseRoute();
            //this.drawRoute(bus); //NOT USED
          })
          .addTo(this.map);
        this.busesMarkers.push(busMarker);
      });
    });
  }

  /**
   * Returns the directory for the icons based on the user's preferred theme.
   * @returns {string} The path to the icon directory.
   */
  getIconDirectory(): string {
    const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    return isDarkTheme ? 'assets/dark/' : 'assets/light/';
  }

  /**
   * Navigates to the bus details page for the specified bus route ID.
   * 
   * @param {string} busRouteId - The ID of the bus route.
   */
  navigateToBusDetails(busRouteId: string) {
    // Iterate through the buses and find the bus with the specified route ID.
    this.buses.forEach(bus => {
      // Check if the current bus's route ID matches the specified route ID.
      if (bus.routeId === busRouteId) {
        // Set the selected bus to the found bus.
        this.selectedBus = bus;
        // Set the flags to display the bus details and hide the stops.
        this.showBuses = false;
        this.showStops = true;
        // Exit the loop after finding the bus.
        return;
      }
    });
  }

  clearBusMarkers() {
    this.busesMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });
  }

  /**
   * Draws a route on the map for the specified bus.
   *
   * @param {Bus} bus - The bus for which to draw the route.
   */
  drawRoute(bus: Bus) {
    // Create a mock position object for the bus
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

    // Find the bus object in the buses array
    bus = this.buses.find(b => b.id === bus.id) as Bus;

    // Get the stops for the bus's current direction
    let stops: any[] = [];
    if (bus.direction === "forward") {
      stops = bus.route.stops.forwardStops;
    } else {
      stops = bus.route.stops.backStops;
    }

    // Draw markers for each stop on the map
    stops.forEach(stop => {
      const customIcon = L.icon({
        iconUrl: this.getIconDirectory() + 'bus-stop-marker.png',
        iconSize: [16, 16],
        iconAnchor: [8, 16],
        popupAnchor: [0, -16]
      });

      L.marker([stop.coords.latitude, stop.coords.longitude], { icon: customIcon })
        .on('click', () => {
          this.eraseRoute();
          this.navigateToStopDetails(stop);
          this.centerStopBus(stop.coords.latitude, stop.coords.longitude);
        })
        .addTo(this.map);
    });

    // Create waypoints for the first and last legs of the route
    if (bus.lastStop >= 0) {
      const firstLegStops = stops.slice(0, bus.lastStop + 1).map((stop: any) => L.latLng(stop.coords.latitude, stop.coords.longitude));
      const firstLegWaypoints = [...firstLegStops, L.latLng(position.coords.latitude, position.coords.longitude)];

      // Add routing control for the first leg of the route
      this.firstRoute = L.Routing.control({
        waypoints: firstLegWaypoints,
        lineOptions: {
          styles: [{ color: 'yellow', opacity: 1, weight: 5, dashArray: '10, 10' }],
          extendToWaypoints: true,
          missingRouteTolerance: 100
        },
        routeWhileDragging: true,
        show: false,
        fitSelectedRoutes: false // Don't adjust the map to fit the route
      }).addTo(this.map);
    }

    const lastLegStops = stops.slice(bus.lastStop + 1).map((stop: any) => L.latLng(stop.coords.latitude, stop.coords.longitude));
    const lastLegWaypoints = [L.latLng(position.coords.latitude, position.coords.longitude), ...lastLegStops];

    // Add routing control for the second leg of the route
    this.secondRoute = L.Routing.control({
      waypoints: lastLegWaypoints,
      routeWhileDragging: true,
      show: true
    }).addTo(this.map);

    // Remove waypoints (of the route) from the map
    this.map.eachLayer((layer: any) => {
      if (layer.options.waypoints && layer.options.waypoints.length) {
        this.map.removeLayer(layer);
      }
    });

    // Hide routing control divs in the DOM
    const routingControlDivs = document.querySelectorAll('.leaflet-routing-container');
    routingControlDivs.forEach(div => {
      (div as HTMLElement).style.display = 'none';
    });
  }

  /**
   * Removes the intermediate points (waypoints) and the routes themselves from the map.
   */
  eraseRoute() {
    // Remove intermediate points (waypoints) from the map
    // This is done by iterating over all the layers on the map and checking if they have waypoints
    // If a layer has waypoints, it is removed from the map
    this.map.eachLayer((layer: any) => {
      if (layer.options.waypoints && layer.options.waypoints.length) {
        this.map.removeLayer(layer);
      }
    });

    // Remove the routes themselves from the map
    // This is done by checking if the firstRoute and secondRoute properties exist
    // If they do, they are removed from the map
    if (this.firstRoute) {
      this.map.removeControl(this.firstRoute);
      this.firstRoute = undefined; // Reset the firstRoute property
    }
    if (this.secondRoute) {
      this.map.removeControl(this.secondRoute);
      this.secondRoute = undefined; // Reset the secondRoute property
    }
  }

  /**
   * Checks if a given object is within a certain radius of the current position.
   * @param objectCoords - The coordinates of the object to check.
   * @param currentCoords - The current position coordinates.
   * @param radius - The radius in meters.
   * @returns True if the object is within the radius, false otherwise.
   */
  isInsideRadius(objectCoords: [number, number], currentCoords: { latitude: number, longitude: number }, radius: number): boolean {
    // Create L.LatLng objects for the object and current position
    const stopLatLng = L.latLng(objectCoords[0], objectCoords[1]);
    const currentLatLng = L.latLng(currentCoords.latitude, currentCoords.longitude);

    // Calculate the distance between the object and current position
    const distance = stopLatLng.distanceTo(currentLatLng);

    // Check if the distance is less than or equal to the radius
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

  /**
   * Calculates the zoom level based on the given radius.
   *
   * @param {number} radius - The radius in meters.
   * @return {number} The calculated zoom level.
   */
  calculateZoomLevel(radius: number): number {
    // The zoom level is calculated using the formula:
    // zoom level = 15 - log2(radius / 500)
    // The logarithm base is 2 (Math.LN2).

    // The zoom level determines the level of detail displayed on the map.
    // A higher zoom level shows more detail, while a lower zoom level shows less detail.

    // The radius is divided by 500 to normalize the calculation.
    // This ensures that the zoom level is consistent regardless of the radius value.

    return Math.round(15 - Math.log(radius / 500) / Math.LN2);
  }

  /**
   * Calculates the distance between two points using Leaflet Routing Machine.
   *
   * @param {GeoPoint | Position} pos1 - The first position (GeoPoint or Position object).
   * @param {GeoPoint} pos2 - The second position (GeoPoint object).
   * @return {number} The calculated distance in meters, rounded to one decimal place.
   */
  getDistance(pos1: GeoPoint | Position, pos2: GeoPoint): number {
    // Convert Position object to GeoPoint if necessary
    if ((pos1 as Position).coords) {
      const positionCoords = (pos1 as Position).coords;
      pos1 = new GeoPoint(positionCoords.latitude, positionCoords.longitude);
    }

    // Create two Leaflet LatLng points
    const point1 = L.latLng((pos1 as GeoPoint).latitude, (pos1 as GeoPoint).longitude);
    const point2 = L.latLng(pos2.latitude, pos2.longitude);

    // Use Leaflet Measure to calculate the distance between the two points
    const distance = L.GeometryUtil.length([point1, point2]);

    // Calculate the distance in kilometers
    const distanceInKilometers = distance / 1000;

    // Round the distance to one decimal place
    const roundedDistance = distanceInKilometers.toFixed(1);

    // Return the rounded distance
    return Number(roundedDistance);
  }

  search(event: CustomEvent) {
    const query = event.detail.value;
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  searchPlaces(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchAddress(query);
  }

  async searchAddress(query: string) {
    if (query && query.length > 0) {
      const results = await provider.search({ query: query });
      this.places = results.map(result => {
        return {
          name: result.label,
          lat: result.y,
          lng: result.x
        };
      });
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
    }, 0);
  }

  ionViewWillEnter() {
    this.modal.present();
  }

  /**
   * This function is called when the view is fully entered.
   * It checks if it is the first time the view is entered and if so, it retrieves the current position
   * and updates the map accordingly.
   */
  ionViewDidEnter() {
    // Check if it is the first time the view is entered
    if (this.onInit) {
      // Get the current position
      let position = this.positionService.getCurrentPosition();
      
      // Check if the position is not (0, 0)
      if (position.coords.latitude != 0 && position.coords.longitude != 0) {
        // Delay the update of the map by 1 second
        setTimeout(() => {
          // Update the current position
          this.currentPosition = position;
          // Hide the marker on the map
          this.drawMarker = false;
          // Update the map with the new position
          this.updateMap();
        }, 1000);
      }
    }
  }

  ionViewWillLeave() {
    this.modal.dismiss();
  }
}

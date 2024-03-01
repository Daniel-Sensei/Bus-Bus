import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { Geolocation, Position } from '@capacitor/geolocation'

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {
  map!: L.Map;
  currentPosition!: Position;

  selectedSegment: string = 'default'; // Segmento attualmente selezionato
  fermate: string[] = ['Fermata 1', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 6', 'Fermata 7', 'Fermata 1', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 6', 'Fermata 7']; // Lista delle fermate
  autobus: string[] = ['Bus A', 'Bus B', 'Bus C']; // Lista dei bus

  constructor() { }

  async getCurrentPosition() {
    try {
      const permissionStatus = await Geolocation.checkPermissions();
      console.log("Permission status: ", permissionStatus.location);
  
      if (permissionStatus.location !== 'granted') {
        const requestStatus = await Geolocation.requestPermissions();
        console.log("Permission request: ", requestStatus.location);
        if (requestStatus.location !== 'granted') {
          // Non è stato concesso il permesso
          // Vai alla pagina delle impostazioni per abilitare il permesso
          // Bisogna garantire posizione esatta per il funzionamento dell'app
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

  ngOnInit() {
    this.initializeDefaultMap();

  }

  initializeDefaultMap() {
    this.map = L.map('map', {
      center: [42.049, 13.348],
      zoom: 5,
      renderer: L.canvas()
    });
  
    L.tileLayer('https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=f24f001e33674c629c27b0332728171c', {
      attribution: 'Open Street Map'
    }).addTo(this.map);
  
    this.map.whenReady(() => {
      setTimeout(() => {
        this.map.invalidateSize();
        this.getCurrentPosition().then(() => {
          this.initializeMap();
        }).catch(error => {
          console.error('Error getting current position', error);
          // Handle error if needed
        });
      }, 1000);
    });
  }

  initializeMap() {
    const currentPosition = this.currentPosition.coords;
    const currentLatLng = L.latLng(currentPosition.latitude, currentPosition.longitude);
  
    // Fly to the current position with gradual zoom animation
    this.map.flyTo(currentLatLng, 14, {
      duration: 2, // Duration of the animation in seconds
      easeLinearity: 0.5 // Controls the easing function, 0.5 means a linear ease
    });
  
    // Once the flyTo animation ends, add the default marker and circle
    this.map.once('zoomend', () => {
      // Remove existing markers and circles
      this.map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
          this.map.removeLayer(layer);
        }
      });
  
      // Add default circle marker for current position
      const marker = L.circleMarker(currentLatLng, {
        radius: 8, // Radius of the marker
        color: 'blue', // Color of the marker border
        fillColor: '#3388ff', // Fill color of the marker
        fillOpacity: 0.8 // Opacity of the marker fill
      }).addTo(this.map);
  
      // Add a default circle around the marker with a radius of 1km
      const circle = L.circle(currentLatLng, {
        radius: 1000, // Default radius of 1km
        color: 'red', // Color of the circle border
        fillColor: '#f03', // Fill color of the circle
        fillOpacity: 0.2 // Opacity of the circle fill
      }).addTo(this.map);
  
      // Extend Leaflet control class
      const RecenterControl = L.Control.extend({
        onAdd: () => {
          const buttonDiv = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
          buttonDiv.innerHTML = `
            <button onclick="recenterMap(1000)">1km</button>
            <button onclick="recenterMap(2000)">2km</button>
            <button onclick="recenterMap(5000)">5km</button>
          `;
          return buttonDiv;
        },
        onRemove: () => {}
      });
  
      // Add the control to the map
      const recenterButton = new RecenterControl({ position: 'topright' });
      recenterButton.addTo(this.map);
    });
  
    // Function to recenter the map on current position with a specified radius
    (window as any).recenterMap = (radius: number) => {
      this.map.flyTo(currentLatLng, this.calculateZoomLevel(radius), {
        duration: 2,
        easeLinearity: 0.5
      });
  
      // Remove existing circle and add new circle with specified radius
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

  // Function to calculate the zoom level based on the radius
  calculateZoomLevel(radius: number): number {
    // Approximation formula for calculating zoom level based on radius
    return Math.round(15 - Math.log(radius / 500) / Math.LN2);
  }
  
  

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  search(event: CustomEvent) {
    const query = event.detail.value;
    console.log(query);
  }


}

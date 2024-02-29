import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { Geolocation, Position } from '@capacitor/geolocation'

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit{
  map!: L.Map;
  currentPosition!: Position;

  selectedSegment: string = 'default'; // Segmento attualmente selezionato
  fermate: string[] = ['Fermata 1', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 6', 'Fermata 7', 'Fermata 1', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 6', 'Fermata 7']; // Lista delle fermate
  autobus: string[] = ['Bus A', 'Bus B', 'Bus C']; // Lista dei bus

  constructor() {}

  async getCurrentPosition() {
    try {
      const permissionStatus = await Geolocation.checkPermissions();
      console.log("Permission status: ", permissionStatus.location);

      if (permissionStatus.location != 'granted') {
        const requestStatus = await Geolocation.requestPermissions();
        console.log("Permission request: ", requestStatus.location);
        if (requestStatus.location != 'granted') {
          // Non è stato concesso il permesso
          // Vai alla pagina delle impostazioni per abilitare il permesso
          // Bisogna garantire posizione esatta per il funzionamento dell'app
          return;
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
      throw(error);
    }
  }

  ngOnInit() {
    this.getCurrentPosition().then(() => {
      this.initializeMap();
    });
  }

  initializeMap() {
    this.map = L.map('map', {
      center: [ this.currentPosition.coords.latitude, this.currentPosition.coords.longitude ],
      zoom: 15,
      renderer: L.canvas()
    });

    //https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=f24f001e33674c629c27b0332728171c --> trasporti
    L.tileLayer('https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=f24f001e33674c629c27b0332728171c', {
      attribution: 'Open Street Map'
    }).addTo(this.map);

    // Definisci l'icona personalizzata
    const customIcon = L.icon({
      iconUrl: 'assets/marker.png', // Percorso dell'immagine personalizzata
      iconSize: [40, 40], // Dimensioni dell'icona
      iconAnchor: [20, 40], // Punto di ancoraggio dell'icona
      popupAnchor: [0, -40] // Punto di ancoraggio del popup (se necessario)
    });

    // Aggiungi il marker con l'icona personalizzata
    const marker = L.marker([this.currentPosition.coords.latitude, this.currentPosition.coords.longitude], { icon: customIcon }).addTo(this.map);

    this.map.whenReady(() => {
      setTimeout(() => {
        this.map.invalidateSize();
      }, 1000);
    });
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  search(event: CustomEvent) {
    const query = event.detail.value;
    console.log(query);
  }

}

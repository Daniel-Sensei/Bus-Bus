import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit{
  map!: L.Map;

  selectedSegment: string = 'default'; // Segmento attualmente selezionato
  fermate: string[] = ['Fermata 1', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 6', 'Fermata 7', 'Fermata 1', 'Fermata 2', 'Fermata 3', 'Fermata 4', 'Fermata 5', 'Fermata 6', 'Fermata 7']; // Lista delle fermate
  autobus: string[] = ['Bus A', 'Bus B', 'Bus C']; // Lista dei bus

  constructor() {}

  ngOnInit() {
    this.initializeMap();
  }

  initializeMap() {
    this.map = L.map('map', {
      center: [ 45.877, 8.695 ],
      zoom: 15,
      renderer: L.canvas()
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
    const marker = L.marker([45.877, 8.695], { icon: customIcon }).addTo(this.map);

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

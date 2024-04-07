import { Component } from '@angular/core';
import { ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular';

import { OpenStreetMapProvider } from 'leaflet-geosearch';
const provider = new OpenStreetMapProvider();

import { PositionService } from '../service/position.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  @ViewChild('cardModal', { static: true }) cardModal!: IonModal; // Ottieni il riferimento al modal
  presentingElement: Element | null = null;
  places: any[] = [];


  constructor(private positionService: PositionService, private router: Router) {}

  ngOnInit() {
    this.presentingElement = document.querySelector('.ion-page');
  }

  openSearchModal() {
    this.cardModal.present();
  }

  focusInput() {
    setTimeout(() => {
      const input = document.querySelector('ion-input') as HTMLIonInputElement;
      input.setFocus();
    }, 0); // 500 milliseconds di ritardo per garantire che il modal sia completamente aperto
  }

  searchPlaces(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    console.log(query);
    this.searchAddress(query);
  }

  changeCurrentPosition(lat: number, lng: number) {
    this.positionService.setCurrentPosition(lat, lng);
    this.cardModal.dismiss();
    this.router.navigate(['/tabs/tab2']);
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
}

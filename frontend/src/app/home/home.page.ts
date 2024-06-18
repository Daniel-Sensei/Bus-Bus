import { Component } from '@angular/core';
import { ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular';

import { OpenStreetMapProvider } from 'leaflet-geosearch';
const provider = new OpenStreetMapProvider();

import { PositionService } from '../service/position.service';
import { Router } from '@angular/router';

import { PreferencesService } from '../service/preferences.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage {

  @ViewChild('cardModal', { static: true }) cardModal!: IonModal; // Ottieni il riferimento al modal
  presentingElement: Element | null = null;
  places: any[] = [];

  favouriteRoutes: string[] = [];
  favouriteStops: string[] = [];
  recentSearches: string[] = [];


  constructor(private positionService: PositionService, private router: Router, private preferencesService: PreferencesService) { }

  /**
   * Initializes the component and sets the presenting element.
   * Also calls the getPreferences function to retrieve user preferences.
   */
  ngOnInit() {
    // Get the presenting element that will be used to present the modal
    this.presentingElement = document.querySelector('.ion-page');

    // Retrieve user preferences
    this.getPreferences();
  }

  getPreferences() {
    this.preferencesService.getFavorites('favouriteRoutes').then(routes => this.favouriteRoutes = routes);
    this.preferencesService.getFavorites('favouriteStops').then(stops => this.favouriteStops = stops);
    this.preferencesService.getFavorites('recentSearches').then(searches => this.recentSearches = searches);
  }

  openSearchModal() {
    this.cardModal.present();
  }

  focusInput() {
    setTimeout(() => {
      const input = document.querySelector('ion-input') as HTMLIonInputElement;
      input.setFocus();
    }, 0);
  }

  searchPlaces(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchAddress(query);
  }

  changeCurrentPosition(name: string, lat: number | string, lng: number | string) {
    this.preferencesService.addToFavorites('recentSearches', lat + ',' + lng + '_' + name);

    lat = typeof lat === 'string' ? parseFloat(lat) : lat;
    lng = typeof lng === 'string' ? parseFloat(lng) : lng;

    this.positionService.setCurrentPosition(lat, lng);
    this.cardModal.dismiss();
    this.router.navigate(['/tabs/tab2']);
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

  /**
   * Returns the directory path for the icon based on the user's preferred theme.
   * @returns {string} The directory path for the icon.
   */
  getIconDirectory(): string {
    // Check if the user's preferred theme is dark or light
    const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Return the directory path for the icon based on the theme
    /**
     * The directory path for the icon.
     * @type {string}
     */
    return isDarkTheme ? 'assets/dark/' : 'assets/light/';
  }

  async setStopPosition(stopId: string) {
    await this.positionService.setCurrentPositionFromStopId(stopId);
    this.cardModal.dismiss();
    this.router.navigate(['/tabs/tab2']);
  }

  ionViewWillEnter() {
    this.getPreferences();
  }
}

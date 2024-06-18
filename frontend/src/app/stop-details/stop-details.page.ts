import { Component, OnInit, Input, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Stop } from '../model/Stop';
import { IonModal } from '@ionic/angular';
import { StopService } from '../service/stop.service';

import { PreferencesService } from '../service/preferences.service';

@Component({
  selector: 'app-stop-details',
  templateUrl: './stop-details.page.html',
  styleUrls: ['./stop-details.page.scss'],
})
export class StopDetailsPage implements OnInit {
  @Input() modal!: IonModal;

  @Input() stop?: Stop;
  @Input() nextBuses?: any;
  @Output() back: EventEmitter<void> = new EventEmitter<void>();

  accordionOpen: boolean = false;
  favourite = false;

  constructor(private stopService: StopService, private preferencesService: PreferencesService) { }

  ngOnInit() {
    this.checkFavourite();
  }

  checkFavourite() {
    this.preferencesService.getFavorites('favouriteStops').then(stops => {
      this.favourite = stops.includes((this.stop?.id || '') + '_' + (this.stop?.name || ''));
    });
  }

  ionViewWillEnter() {
  }

  backToStops() {
    this.back.emit();
  }

  resizeModal() {
    this.accordionOpen = !this.accordionOpen;
    const breakpoint = this.accordionOpen ? 1 : 0.30;
    this.modal.setCurrentBreakpoint(breakpoint);
  }

  addFavourite(add: boolean) {
    this.favourite = add;
    if(add){
    this.preferencesService.addToFavorites('favouriteStops', (this.stop?.id || '') + '_' + (this.stop?.name || ''));
    }
    else{
      this.preferencesService.removeFromFavorites('favouriteStops', (this.stop?.id || '') + '_' + (this.stop?.name || ''));
    }
  }
}

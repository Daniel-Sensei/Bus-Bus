import { Component, OnInit, Input, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Stop } from '../model/Stop';
import { IonModal } from '@ionic/angular';

@Component({
  selector: 'app-stop-details',
  templateUrl: './stop-details.page.html',
  styleUrls: ['./stop-details.page.scss'],
})
export class StopDetailsPage implements OnInit {
  @Input() modal!: IonModal;

  @Input() stop?: Stop;
  @Output() back: EventEmitter<void> = new EventEmitter<void>();

  accordionOpen: boolean = false;

  favourite = false;

  constructor() {}

  ngOnInit() {
    console.log('ngOnInit');
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter');
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
  }
}

import { Component, OnInit, Input, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Stop } from '../model/Stop';
import { IonModal } from '@ionic/angular';
import { StopService } from '../service/stop.service';

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

  constructor(private stopService: StopService) { }

  ngOnInit() {
    console.log('ngOnInit of the stop details page', this.stop?.name);
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter');
  }

  backToStops() {
    this.back.emit();
  }

  resizeModal() {
    this.accordionOpen = !this.accordionOpen;
    const breakpoint = this.accordionOpen ? 1 : 0.33;
    this.modal.setCurrentBreakpoint(breakpoint);
  }

  addFavourite(add: boolean) {
    this.favourite = add;
  }
}

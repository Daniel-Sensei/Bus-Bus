import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Bus } from '../model/Bus';
import { IonModal } from '@ionic/angular';

@Component({
  selector: 'app-bus-details',
  templateUrl: './bus-details.page.html',
  styleUrls: ['./bus-details.page.scss'],
})
export class BusDetailsPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  @Input() modal!: IonModal;

  @Input() bus?: Bus;
  @Output() back: EventEmitter<void> = new EventEmitter<void>();

  backToBuses(){
    this.back.emit();
  }

}
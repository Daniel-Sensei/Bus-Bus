import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Bus } from '../model/Bus';
import { IonModal } from '@ionic/angular';
import { Coordinates } from '../model/Coordinates';

@Component({
  selector: 'app-bus-details',
  templateUrl: './bus-details.page.html',
  styleUrls: ['./bus-details.page.scss'],
})
export class BusDetailsPage implements OnInit {

  accordionOpen: boolean = false;
  favourite = false;
  destination: string = "";

  constructor() { }

  getDestination(back = false): string {
    let destination = "";
    let code = this.bus.route.code.split("_")[1];
    // in questo momento code continete qaulcosa del tipo "Nicastro-Fronti-Sambiase"
    // se !back allora la destinazione dovrà seprarae il trattino e prendere "Nicastro - Fronti - Sambiase"
    // altrimenti dovra invertire l'rdine e prendere "Sambiase -Fronti - Nicastro"
    if(!back){
      destination = code.split("-").join(" - ");
    }
    else{
      destination = code.split("-").reverse().join(" - ");
    }
    return destination;
  }

  ngOnInit() {
    console.log("ON INIT BUS: ", this.bus);
    if(this.bus.direction === "back"){
      this.stops = Object.values(this.bus.route.stops.backStops);
      this.getDestination(true);
    }
    else{
      this.stops = Object.values(this.bus.route.stops.forwardStops);
      this.destination = this.getDestination();
    }
    console.log("stops= ", this.stops);
  }

  @Input() modal!: IonModal;

  @Input() bus!: Bus;
  @Output() back: EventEmitter<void> = new EventEmitter<void>();

  stops: any;

  backToBuses(){
    this.back.emit();
  }

  resizeModal() {
    this.accordionOpen = !this.accordionOpen;
    const breakpoint = this.accordionOpen ? 1 : 0.32;
    this.modal.setCurrentBreakpoint(breakpoint);
  }

  addFavourite(add: boolean) {
    this.favourite = add;
  }

}

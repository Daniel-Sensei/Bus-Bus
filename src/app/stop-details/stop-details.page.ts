import { Component, OnInit, Input, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';

@Component({
  selector: 'app-stop-details',
  templateUrl: './stop-details.page.html',
  styleUrls: ['./stop-details.page.scss'],
})
export class StopDetailsPage implements OnInit {
  @Input() stop!: number;
  @Output() back: EventEmitter<void> = new EventEmitter<void>();

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

}

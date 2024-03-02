import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';


@Component({
  selector: 'app-stops-modal',
  templateUrl: './stops-modal.component.html',
  styleUrls: ['./stops-modal.component.scss'],
})
export class StopsModalComponent  implements OnInit {

  selectedSegment: string = 'default';

  constructor() { }

  ngOnInit() {}

  segmentChanged(event: any) {
      this.selectedSegment = event.detail.value;
    }

}

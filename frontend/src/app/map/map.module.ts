import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapPage } from './map.page';

import { MapPageRoutingModule } from './map-routing.module';

import { StopDetailsPageModule } from '../stop-details/stop-details.module';
import { BusDetailsPageModule } from '../bus-details/bus-details.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,    
    MapPageRoutingModule,
    StopDetailsPageModule,
    BusDetailsPageModule
  ],
  declarations: [MapPage]
})
export class MapPageModule {}

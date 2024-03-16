import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BusDetailsPageRoutingModule } from './bus-details-routing.module';

import { BusDetailsPage } from './bus-details.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BusDetailsPageRoutingModule
  ],
  declarations: [BusDetailsPage],
  exports: [BusDetailsPage]
})
export class BusDetailsPageModule {}

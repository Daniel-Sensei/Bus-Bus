import { Input, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StopDetailsPageRoutingModule } from './stop-details-routing.module';

import { StopDetailsPage } from './stop-details.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StopDetailsPageRoutingModule
  ],
  declarations: [StopDetailsPage],
  exports: [StopDetailsPage]
})
export class StopDetailsPageModule {}

import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab2Page } from './tab2.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { Tab2PageRoutingModule } from './tab2-routing.module';

import { StopDetailsPageModule } from '../stop-details/stop-details.module';
import { BusDetailsPageModule } from '../bus-details/bus-details.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    
    Tab2PageRoutingModule,
    StopDetailsPageModule,
    BusDetailsPageModule
  ],
  declarations: [Tab2Page]
})
export class Tab2PageModule {}

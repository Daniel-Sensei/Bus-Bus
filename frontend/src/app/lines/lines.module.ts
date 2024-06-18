import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LinesPage } from './lines.page';

import { LinesPageRoutingModule } from './lines-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    LinesPageRoutingModule
  ],
  declarations: [LinesPage]
})
export class LinesPageModule {}

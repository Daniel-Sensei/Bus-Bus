import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BusDetailsPage } from './bus-details.page';

const routes: Routes = [
  {
    path: '',
    component: BusDetailsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BusDetailsPageRoutingModule {}

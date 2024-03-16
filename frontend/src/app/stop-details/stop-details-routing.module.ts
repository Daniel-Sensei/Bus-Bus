import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StopDetailsPage } from './stop-details.page';

const routes: Routes = [
  {
    path: '',
    component: StopDetailsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StopDetailsPageRoutingModule {}

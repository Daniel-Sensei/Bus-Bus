import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LinesPage } from './lines.page';

const routes: Routes = [
  {
    path: '',
    component: LinesPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LinesPageRoutingModule {}

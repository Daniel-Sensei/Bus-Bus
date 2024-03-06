import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'stop-details/:id',
    loadChildren: () => import('./stop-details/stop-details.module').then( m => m.StopDetailsPageModule)
  },  {
    path: 'bus-details',
    loadChildren: () => import('./bus-details/bus-details.module').then( m => m.BusDetailsPageModule)
  }


];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

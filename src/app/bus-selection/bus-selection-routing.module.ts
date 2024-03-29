import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BusSelectionPage } from './bus-selection.page';

const routes: Routes = [
  {
    path: '',
    component: BusSelectionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BusSelectionPageRoutingModule {}

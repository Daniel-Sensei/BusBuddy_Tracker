import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BusSelectionPageRoutingModule } from './bus-selection-routing.module';

import { BusSelectionPage } from './bus-selection.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BusSelectionPageRoutingModule
  ],
  declarations: [BusSelectionPage]
})
export class BusSelectionPageModule {}

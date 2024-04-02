import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrackingPage } from './tracking.page';

import { TrackingPageRoutingModule } from './tracking-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TrackingPageRoutingModule,
  ],
  declarations: [TrackingPage]
})
export class TrackingPageModule {}

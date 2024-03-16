import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TrackButtonComponent
 } from './track-button.component';
@NgModule({
  imports: [ CommonModule, FormsModule, IonicModule],
  declarations: [TrackButtonComponent],
  exports: [TrackButtonComponent]
})
export class TrackButtonComponentModule {}

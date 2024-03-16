import { Component, OnInit } from '@angular/core';
import { Geolocation, PositionOptions } from '@capacitor/geolocation';

@Component({
  selector: 'app-track-button',
  templateUrl: './track-button.component.html',
  styleUrls: ['./track-button.component.scss'],
})
export class TrackButtonComponent  implements OnInit {

  currentPosition: any = undefined;

  constructor() { }

  ngOnInit() {
    this.getCurrentPosition();
  }

  async getCurrentPosition() {
    console.log("Getting current position");
    try {
      const permissionStatus = await Geolocation.checkPermissions();
      console.log("Permission status: ", permissionStatus.location);

      if (permissionStatus.location !== 'granted') {
        const requestStatus = await Geolocation.requestPermissions();
        console.log("Permission request: ", requestStatus.location);
        if (requestStatus.location !== 'granted') {
          throw new Error('Permission not granted');
        }
      }

      let options: PositionOptions = {
        maximumAge: 3000,
        timeout: 10000,
        enableHighAccuracy: true
      };
      this.currentPosition = await Geolocation.getCurrentPosition(options);
    } catch (error) {
      console.error('Error getting current position', error);
    }
  }

}

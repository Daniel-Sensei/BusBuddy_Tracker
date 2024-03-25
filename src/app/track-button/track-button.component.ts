import { Component, OnInit, OnDestroy } from '@angular/core';
import { Geolocation, PositionOptions, GeolocationPosition } from '@capacitor/geolocation';
import { ref, set, getDatabase } from 'firebase/database';
import { Bus } from '../model/Bus';
import { BusService } from '../service/bus.service';
import { LoginService } from '../service/login.service';

import {registerPlugin} from "@capacitor/core";
import {BackgroundGeolocationPlugin} from "@capacitor-community/background-geolocation";


@Component({
  selector: 'app-track-button',
  templateUrl: './track-button.component.html',
  styleUrls: ['./track-button.component.scss'],
})
export class TrackButtonComponent implements OnInit, OnDestroy {

  watchId: string | undefined;
  tracking = false;
  firebaseDB: any;

  BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");


  bus: Bus = {
    id: '', //TODO: Replace with your bus ID by authenticating with Firebase
    code: 'CH349ZY',
    coords: {
      latitude: 0,
      longitude: 0
    },

    route: {
      id: '',
      company: '',
      code: '',
      coords: {
        latitude: 0,
        longitude: 0,
      },

      stops: {
        forwardStops: {
        },
        backStops: {
        },
      },
    },
    direction: '',
    lastStop: -1
  };

  lastDirection = '';
  token = '';

  options: PositionOptions = {
    enableHighAccuracy: true
  };

  constructor(private busService: BusService, private loginService: LoginService) {
    this.firebaseDB = getDatabase();  
  }

  ngOnInit() {
    //this.getBusCoords();
    //TODO: Token must be passed in Input from login component or taken by the memory of the device
    this.getToken();
  }

  async getToken() {
    this.loginService.login("consorzio.autolinee@cosenza.it", "consorzio")
      .then(token => {
        if (token) {
          console.log('Accesso riuscito. Token:', token);
          this.token = token;
          // Esegui le operazioni necessarie dopo l'accesso
          this.getBus(this.bus.code, this.token);
        } else {
          console.log('Accesso non riuscito.');
          // Gestisci il fallimento dell'accesso
        }
      })
      .catch(error => {
        console.error('Errore durante il login:', error);
        // Gestisci gli errori di autenticazione
      });
  }


  getBus(code: string, token: string) {
    this.busService.getBusByCode(code, token).subscribe(
      (data: any) => {
        this.bus = data;
        console.log('Bus loaded', this.bus);
        //this.startTracking();
      },
      error => {
        console.error('Error getting bus', error);
      }
    );
  }

  ngOnDestroy() {
    // Stop tracking when the component is destroyed
    this.stopTracking();
  }

  async checkGeolocationPermission() {
    const permissionStatus = await Geolocation.checkPermissions();
    if (permissionStatus.location !== 'granted') {
      const requestStatus = await Geolocation.requestPermissions();
      if (requestStatus.location !== 'granted') {
        throw new Error('Permission not granted');
      }
    }
  }

  async getBusCoords() {
    try {
      this.checkGeolocationPermission();

      this.bus.coords = (await Geolocation.getCurrentPosition(this.options)).coords;
    } catch (error) {
      console.error('Error getting current position', error);
    }
  }

  async startTracking() {
    try {
      this.checkGeolocationPermission();

      const options: PositionOptions = {
        enableHighAccuracy: true
      };
      // Avvia il tracciamento della posizione e memorizza l'ID del watcher
      this.tracking = true;
      this.watchId = await Geolocation.watchPosition(options, (position, err) => {
        if (err) {
          console.error('Error watching position', err);
        } else {
          this.bus.coords.latitude = position?.coords.latitude || 0;
          this.bus.coords.longitude = position?.coords.longitude || 0;
          // Aggiorna il Realtime Database di Firebase con la nuova posizione
          if (this.bus.coords.latitude !== 0 && this.bus.coords.longitude !== 0) {
            console.log('Position in updating', this.bus.coords);
            this.updateRealTimeCoords(this.bus.coords);
            console.log('Position updated');

            if (this.checkStopReached(this.bus.coords)) {
              this.busService.updateStopReached(this.bus.route.id, this.bus.lastStop.toString(), this.bus.direction).subscribe(
                (data: boolean) => {
                  console.log('Stop reached updated', data);
                },
                error => {
                  console.error('Error updating stop reached', error);
                }
              );
            }
          }
        }
      });
    } catch (error) {
      console.error('Error starting position tracking', error);
    }
  }

  updateRealTimeCoords(coords: any) {
    // Aggiorna il Realtime Database di Firebase con la nuova posizione
    console.log('Updating position before ref', coords);
    const dbRef = ref(this.firebaseDB, 'buses/' + this.bus.id + '/coords');
    console.log("dbRef", dbRef);
    set(dbRef, {
      latitude: coords.latitude,
      longitude: coords.longitude
    })
      .then(() => console.log('Position updated successfully'))
      .catch(error => console.error('Error updating position', error));
  }

  checkStopReached(busCoords: any): boolean {
    // Controlla se il bus è vicino a una fermata
    let stopReached = false;

    if (this.bus.direction !== "") {
      console.log('Direction: ', this.bus.direction);
      const stops = this.getStopsByDirection();
      let i = 0;
      for (const stop of stops) {
        const distance = this.calculateDistance(busCoords.latitude, busCoords.longitude, stop.coords.latitude, stop.coords.longitude);
        if (distance < 0.05 && (this.bus.lastStop != i || this.bus.direction != this.lastDirection)) { // 50m of distance
          console.log('Stop reached', stop);
          stopReached = true;
          this.lastDirection = this.bus.direction;
          this.bus.lastStop = i;
          this.updateDirectionAndStop();
          break;
        }
        i++;
      }
    } else {
      console.log('Direction not set');
      const stopsForward = this.bus.route.stops.forwardStops;
      const stopsBack = this.bus.route.stops.backStops;

      stopReached = this.checkStopsInDirection(stopsForward, busCoords) || this.checkStopsInDirection(stopsBack, busCoords);
    }

    return stopReached;
  }

  getStopsByDirection(): any[] {
    let stops = {};
    if (this.bus.direction === 'forward') {
      stops = this.bus.route.stops.forwardStops;
    } else if (this.bus.direction === 'back') {
      stops = this.bus.route.stops.backStops;
    }
    return Object.values(stops);
  }

  checkStopsInDirection(stops: any, busCoords: any): boolean {
    let stopReached = false;
    let i = 0;
    for (const stop of stops) {
      const distance = this.calculateDistance(busCoords.latitude, busCoords.longitude, stop.coords.latitude, stop.coords.longitude);
      if (distance < 0.05) { // 50m of distance
        console.log('Stop reached', stop);
        stopReached = true;
        this.bus.lastStop = i;
        this.bus.direction = (this.bus.direction === 'forward') ? 'back' : 'forward';
        this.lastDirection = this.bus.direction;
        if (this.bus.lastStop === stops.length - 1) {
          this.bus.lastStop = 0;
        }
        break;
      }
      i++;
    }
    return stopReached;
  }

  updateDirectionAndStop() {
    if (this.bus.direction === 'forward' && this.bus.lastStop === Object.keys(this.bus.route.stops.forwardStops).length - 1) {
      this.bus.direction = 'back';
      this.bus.lastStop = 0;
    } else if (this.bus.direction === 'back' && this.bus.lastStop === Object.keys(this.bus.route.stops.backStops).length - 1) {
      this.bus.direction = 'forward';
      this.bus.lastStop = 0;
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raggio della Terra in chilometri
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distanza in chilometri
    return d;
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  stopTracking() {
    // Interrompi il tracciamento della posizione se è attivo
    this.tracking = false;
    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
    }
  }
}

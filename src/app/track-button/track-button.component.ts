import { Component, OnInit, OnDestroy } from '@angular/core';
import { ref, set, getDatabase } from 'firebase/database';
import { Bus } from '../model/Bus';
import { BusService } from '../service/bus.service';
import { LoginService } from '../service/login.service';

import { registerPlugin } from "@capacitor/core";
import { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import { LocalNotifications } from '@capacitor/local-notifications';


@Component({
  selector: 'app-track-button',
  templateUrl: './track-button.component.html',
  styleUrls: ['./track-button.component.scss'],
})
export class TrackButtonComponent implements OnInit, OnDestroy {

  tracking = false;
  firebaseDB: any;
  watcherId: any;
  BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");

  bus: Bus = {
    id: '', //TODO: Replace with your bus ID by authenticating with Firebase
    code: '', //CH349ZY
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

  token = '';
  onlyForward = false;
  lastStopName = '';

  // Used by the Geolocation API to get the current position
  options = {
    backgroundMessage: "Cancel to prevent battery drain.",
    backgroundTitle: "Tracking You.",
    requestPermissions: true,
    stale: false,
    distanceFilter: 0 // 50m of distance between updates
  };

  constructor(private busService: BusService, private loginService: LoginService) {
    this.firebaseDB = getDatabase();
  }

  ngOnInit() {
    console.log('TrackButtonComponent INIT!!!!!!!!!!!!!!!');
    //TODO: Token must be passed in Input from login component or taken by the memory of the device
    this.loginService.getToken().then(token => {
      console.log('Token Ricevuto:', token);
      this.loginService.getBusCode().then(busCode => {
        console.log('Codice pullman ricevuto:', busCode);
        this.bus.code = busCode;
        this.getBus(busCode, token);
      });
    });
  }

  /*
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
  */


  async getBus(code: string, token: string) {
    try {
      const data = await this.busService.getBusByCode(code, token);
      this.bus = data;
      console.log('Bus loaded', this.bus);
      if (this.bus.route.stops.backStops === undefined || Object.keys(this.bus.route.stops.backStops).length === 0) {
        this.onlyForward = true;
      }
      this.bus.direction = '';
      console.log('Only forward:', this.onlyForward);
      //this.startTracking();
    } catch (error) {
      console.error('Error getting bus', error);
    }
  }


  ngOnDestroy() {
    // Stop tracking when the component is destroyed
    this.stopTracking();
  }

  async startTracking() {
    try {
      LocalNotifications.requestPermissions().then((permission) => {
        this.tracking = true;
        this.BackgroundGeolocation.addWatcher(this.options, async (location, error) => {
          if (error) {
            if (error.code === "NOT_AUTHORIZED") {
              if (window.confirm(
                "This app needs your location, " +
                "but does not have permission.\n\n" +
                "Open settings now?"
              )) {
                this.BackgroundGeolocation.openSettings();
              }
            }
            console.error(error);
            return;
          }

          if (this.tracking) {
            // Handle the location update
            this.bus.coords.latitude = location?.latitude || 0;
            this.bus.coords.longitude = location?.longitude || 0;
            // Aggiorna il Realtime Database di Firebase con la nuova posizione
            if (this.bus.coords.latitude !== 0 && this.bus.coords.longitude !== 0) {
              this.updateRealTimeCoords(this.bus.coords, this.bus.direction, this.bus.lastStop, location?.speed);

              if (this.checkStopReached(this.bus.coords)) {
                try {
                  const data = await this.busService.updateStopReached(this.bus.route.id, this.bus.lastStop.toString(), this.bus.direction);
                  let oldDirection = this.bus.direction;
                  let oldStop = this.bus.lastStop;
                  this.updateDirectionAndStop();
                  if (this.bus.direction != oldDirection || (this.onlyForward && oldStop === Object.keys(this.bus.route.stops.forwardStops).length - 1)) {
                    this.busService.fixHistoryGaps(this.bus.route.id, oldDirection);
                  }
                  console.log('Stop reached: ', data);
                } catch (error) {
                  console.error('Error updating stop reached', error);
                }
              }
            }
          }
          else {
            console.log('STOP TRACKING');
            this.BackgroundGeolocation.removeWatcher({ id: this.watcherId }).then(() => {
              console.log('Watcher removed')
            });
          }
        }).then((watcherId) => {
          this.watcherId = watcherId; // Memorizza l'ID del watcher
        });
      });
    } catch (error) {
      console.error('Error starting position tracking', error);
    }
  }

  updateRealTimeCoords(coords: any, direction: string, lastStop: number, speed: number | null | undefined) {
    // Aggiorna il Realtime Database di Firebase con la nuova posizione
    console.log("params: ", coords, direction, lastStop, speed);
    const dbRef = ref(this.firebaseDB, 'buses/' + this.bus.id);
    set(dbRef, {
      coords: {
        latitude: coords.latitude,
        longitude: coords.longitude
      },
      direction: direction,
      lastStop: lastStop,
      speed: speed,
      routeId: this.bus.route.id
    })
      .then(() => console.log('Position updated successfully'))
      .catch(error => console.error('Error updating position', error));
  }

  checkStopReached(busCoords: any): boolean {
    // Controlla se il bus è vicino a una fermata
    let stopReached = false;

    console.log("VEDIAMO SE RICORDA", this.bus.direction);
    if (this.bus.direction !== undefined && this.bus.direction !== '') {
      console.log("direction: ", this.bus.direction);
      const stops = this.getStopsByDirection();
      for (let i = this.bus.lastStop + 1; i < stops.length; i++) { //escludo se stesso
        const stop = stops[i];
        const distance = this.calculateDistance(busCoords.latitude, busCoords.longitude, stop.coords.latitude, stop.coords.longitude);
        if (distance < 0.05 && this.lastStopName != stop.name) { // 50m of distance
            console.log('Stop reached', stop);
            stopReached = true;
            this.bus.lastStop = i;
            this.lastStopName = stop.name;
            //this.updateDirectionAndStop();
            break;
        }
      }
    } else {
      console.log("direction NOT set");
      const stopsForward = this.bus.route.stops.forwardStops;
      const stopsBack = this.bus.route.stops.backStops;

      stopReached = this.checkStopsInDirection(stopsForward, 'forward', busCoords) || this.checkStopsInDirection(stopsBack, 'back', busCoords);
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

  checkStopsInDirection(stops: any, direction: string, busCoords: any): boolean {
    let stopReached = false;
    let i = 0;
    for (const stop of stops) {
      const distance = this.calculateDistance(busCoords.latitude, busCoords.longitude, stop.coords.latitude, stop.coords.longitude);
      if (distance < 0.05) { // 50m of distance
        console.log('Stop reached without direction: ', stop);
        stopReached = true;
        this.bus.lastStop = i;
        this.bus.direction = direction;
        this.lastStopName = stop.name;
        console.log("New direction: ", this.bus.direction);
        console.log("Last stop: ", this.bus.lastStop);
        break;
      }
      i++;
    }
    return stopReached;
  }

  updateDirectionAndStop() {
    if (this.bus.direction === 'forward' && this.bus.lastStop === Object.keys(this.bus.route.stops.forwardStops).length - 1 && !this.onlyForward) {
      this.bus.direction = 'back';
      this.lastStopName = '';
      this.bus.lastStop = -1;
    } else if (this.bus.direction === 'back' && this.bus.lastStop === Object.keys(this.bus.route.stops.backStops).length - 1) {
      this.bus.direction = 'forward';
      this.lastStopName = '';
      this.bus.lastStop = -1;
    } else if (this.bus.direction === 'forward' && this.bus.lastStop === Object.keys(this.bus.route.stops.forwardStops).length - 1 && this.onlyForward) {
      this.stopTracking();
    } else if (this.bus.direction === '' && this.bus.lastStop === Object.keys(this.bus.route.stops.forwardStops).length - 1 && this.onlyForward) {
      this.stopTracking();
    } else if (this.bus.direction === '' && this.bus.lastStop === Object.keys(this.bus.route.stops.forwardStops).length - 1 && !this.onlyForward) {
      this.bus.direction = 'back';
      this.lastStopName = '';
      this.bus.lastStop = -1;
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
    this.bus.direction = '';
    this.bus.lastStop = -1;
  }

}

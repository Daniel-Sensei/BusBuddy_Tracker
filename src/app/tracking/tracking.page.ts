import { Component, OnInit, OnDestroy } from '@angular/core';
import { ref, set, getDatabase } from 'firebase/database';
import { Bus } from '../model/Bus';
import { BusService } from '../service/bus.service';
import { LoginService } from '../service/login.service';

import { registerPlugin } from "@capacitor/core";
import { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import { LocalNotifications } from '@capacitor/local-notifications';
import { Router } from '@angular/router';
import { ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular';
import { AlertController } from '@ionic/angular';


@Component({
  selector: 'app-tab1',
  templateUrl: 'tracking.page.html',
  styleUrls: ['tracking.page.scss']
})
export class TrackingPage implements OnInit, OnDestroy {

  firebaseDB: any;

  /* Tracking */
  tracking = false;
  watcherId: any;
  onlyForward = false;
  lastStopName = '';
  BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");
  // Used by the Geolocation API to get the current position
  options = {
    backgroundMessage: "Cancel to prevent battery drain.",
    backgroundTitle: "Tracking You.",
    requestPermissions: true,
    stale: false,
    distanceFilter: 0 // 50m of distance between updates
  };
  permissionChecked = false;

  /* Modal */
  @ViewChild('modal', { static: true }) modal!: IonModal; // Ottieni il riferimento al modal
  accordionOpen: boolean = false;
  destination: string = "";
  stops: any;

  loading = true;

  /* Timer */
  timerValue: string = '00:00:00';
  private intervalId: any;

  bus: Bus = {
    id: '',
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

  constructor(
    private busService: BusService,
    private loginService: LoginService,
    private router: Router,
    private alertController: AlertController
  ) {
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
        this.getBus(busCode);
      });
    });
  }

  async getBus(code: string) {
    try {
      const data = await this.busService.getBusByCode(code);
      this.bus = data;
      this.loading = false;
      console.log('Bus loaded', this.bus);
      if (this.bus.route.stops.backStops === undefined || Object.keys(this.bus.route.stops.backStops).length === 0) {
        this.onlyForward = true;
      }
      this.bus.direction = '';
      console.log('Only forward:', this.onlyForward);

      this.updateStopsAndDestination(); // in the modal
    } catch (error) {
      console.error('Error getting bus', error);
    }
  }

  async startTracking() {
    this.permissionChecked = false;
    
    try {
      LocalNotifications.requestPermissions().then((permission) => {
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
          if(!this.permissionChecked){
            this.tracking = true;
            // Inizializza il tempo trascorso a zero
            this.startTimer();
          }
          this.permissionChecked = true;

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
                    this.updateStopsAndDestination();
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
            //this.permissionChecked = false;
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

  async requestStopTracking() {
    const alert = await this.alertController.create({
      header: 'Conferma',
      message: 'Sei sicuro di voler interrompere il tracciamento?',
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel',
          handler: () => {
            // L'utente ha annullato, non fare nulla
          }
        },
        {
          text: 'Conferma',
          handler: () => {
            // L'utente ha confermato, interrompi il tracciamento
            this.stopTracking();
          }
        }
      ]
    });

    await alert.present();
  }

  stopTracking() {
    // Interrompi il tracciamento della posizione se è attivo
    this.tracking = false;
    this.bus.direction = '';
    this.bus.lastStop = -1;
    this.lastStopName = '';
    clearInterval(this.intervalId);
    this.bus.coords.latitude = 0;
    this.bus.coords.longitude = 0;
    this.updateRealTimeCoords(this.bus.coords, this.bus.direction, this.bus.lastStop, 0);
  }

  // Aggiorna il metodo logout per visualizzare un popup di conferma prima del logout
  async logout() {
    const alert = await this.alertController.create({
      header: 'Conferma',
      message: 'Sei sicuro di voler effettuare il logout?',
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel',
          handler: () => {
            // L'utente ha annullato, non fare nulla
          }
        },
        {
          text: 'Conferma',
          handler: () => {
            // L'utente ha confermato, esegui il logout
            this.performLogout();
          }
        }
      ]
    });

    await alert.present();
  }

  // Metodo per eseguire il logout effettivo
  private performLogout() {
    this.loginService.logout().then(() => {
      // Reindirizza l'utente alla pagina di login senza passare alcun parametro e ricarica la pagina
      this.router.navigate(['login'], { replaceUrl: true });
    });
  }

  /* MODAL */
  updateStopsAndDestination() {
    if (this.bus.direction === "back") {
      this.stops = Object.values(this.bus.route.stops.backStops);
      this.getDestination(true);
    }
    else {
      this.stops = Object.values(this.bus.route.stops.forwardStops);
      this.destination = this.getDestination();
    }
  }

  resizeModal() {
    this.accordionOpen = !this.accordionOpen;
    const breakpoint = this.accordionOpen ? 1 : 0.33;
    this.modal.setCurrentBreakpoint(breakpoint);
  }

  getDestination(back = false): string {
    let destination = "";
    let code = this.bus.route.code.split("_")[1];
    // in questo momento code continete qaulcosa del tipo "Nicastro-Fronti-Sambiase"
    // se !back allora la destinazione dovrà seprarae il trattino e prendere "Nicastro - Fronti - Sambiase"
    // altrimenti dovra invertire l'rdine e prendere "Sambiase -Fronti - Nicastro"
    if (!back) {
      destination = code.split("-").join(" - ");
    }
    else {
      destination = code.split("-").reverse().join(" - ");
    }
    return destination;
  }

  /* TIMER */
  startTimer() {
    let elapsedTimeInSeconds = 0;

    // Avvia l'intervallo e memorizza l'ID restituito da setInterval()
    this.intervalId = setInterval(() => {
      elapsedTimeInSeconds++;
      // Calcola ore, minuti e secondi
      const hours = Math.floor(elapsedTimeInSeconds / 3600);
      const minutes = Math.floor((elapsedTimeInSeconds % 3600) / 60);
      const seconds = elapsedTimeInSeconds % 60;

      // Formatta il tempo in "HH:MM:SS"
      const formattedTime = `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      // Aggiorna il valore del timer nell'interfaccia
      this.timerValue = formattedTime;
    }, 1000);
  }

  ionViewWillLeave() {
    this.modal.dismiss();
    this.loading = true;
    this.stopTracking();
  }

  ngOnDestroy() {
    // Stop tracking when the component is destroyed
    this.stopTracking();
  }

}


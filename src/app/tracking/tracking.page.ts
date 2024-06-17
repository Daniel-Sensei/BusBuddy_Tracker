import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { getAuth, onAuthStateChanged } from 'firebase/auth';



@Component({
  selector: 'app-tab1',
  templateUrl: 'tracking.page.html',
  styleUrls: ['tracking.page.scss']
})
export class TrackingPage implements OnInit, OnDestroy {

  firebaseDB: any;

  /* TRACKING */
  readonly GEOFENCE_RADIUS = 0.075; // 75m of radius
  tracking = false;
  watcherId: any;
  onlyForward = false;
  lastStopName = '';
  BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");

  // Used by the Geolocation API to get the current position
  options = {
    backgroundMessage: "Il tracciamento potrebbe ridurre la durata della batteria.",
    backgroundTitle: "Tracciamento in corso",
    requestPermissions: true,
    stale: false,
    distanceFilter: 50, // 50m of distance between updates
  };
  permissionChecked = false;

  /* MODAL */
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
    private alertController: AlertController,
    private cdr: ChangeDetectorRef
  ) {
    this.firebaseDB = getDatabase();
  }

  /**
   * Initializes the component and retrieves the bus code and token from the login service.
   * Calls the getBus method with the retrieved bus code.
   * @returns {Promise<void>} A promise that resolves when the initialization is complete.
   */
  ngOnInit(): Promise<void> {
    // Get the token from the login service
    return this.loginService.getToken()
      .then(token => {
        console.log('Token Ricevuto:', token);
        // Get the bus code from the login service
        return this.loginService.getBusCode()
          .then(busCode => {
            console.log('Codice pullman ricevuto:', busCode);
            // Set the bus code
            this.bus.code = busCode;
            // Call the getBus method with the bus code
            return this.getBus(busCode);
          });
      });
  }
  /**
   * Retrieves the bus data by its code from the bus service.
   * Updates the bus property with the retrieved data.
   * Sets loading to false.
   * Logs the bus data.
   * Checks if the bus has back stops and sets onlyForward accordingly.
   * Sets the direction and lastStop properties of the bus to empty string and -1 respectively.
   * Logs the value of onlyForward.
   * Calls the updateStopsAndDestination method to update the stops and destination in the modal.
   * @param {string} code - The code of the bus to retrieve.
   * @returns {Promise<void>} A promise that resolves when the bus data is retrieved.
   */
  async getBus(code: string) {
    try {
      // Retrieve the bus data by its code
      const data = await this.busService.getBusByCode(code);
      // Update the bus property with the retrieved data
      this.bus = data;
      // Set loading to false
      this.loading = false;
      // Log the bus data
      console.log('Bus loaded', this.bus);
      // Check if the bus has back stops
      if (this.bus.route.stops.backStops === undefined || Object.keys(this.bus.route.stops.backStops).length === 0) {
        // Set onlyForward to true if the bus has no back stops
        this.onlyForward = true;
      }
      // Set the direction and lastStop properties of the bus to empty string and -1 respectively
      this.bus.direction = '';
      this.bus.lastStop = -1;
      // Log the value of onlyForward
      console.log('Only forward:', this.onlyForward);
      // Call the updateStopsAndDestination method to update the stops and destination in the modal
      this.updateStopsAndDestination();
    } catch (error) {
      // Log the error if there is an error retrieving the bus data
      console.error('Error getting bus', error);
    }
  }

  /**
   * Starts tracking the bus's location.
   * Requests location permission, adds a watcher to the BackgroundGeolocation plugin,
   * and handles location updates.
   * @returns {Promise<void>} A promise that resolves when the tracking is started.
   */
  async startTracking() {
    this.permissionChecked = false;

    try {
      // Request location permission
      LocalNotifications.requestPermissions().then((permission) => {
        // Add a watcher to the BackgroundGeolocation plugin
        this.BackgroundGeolocation.addWatcher(this.options, async (location, error) => {
          if (error) {
            // Handle error if not authorized
            if (error.code === "NOT_AUTHORIZED") {
              if (window.confirm(
                "Questa app ha bisogno di accedere alla tua posizione, " +
                "ma non sono state fornicate le autorizzazioni necessarie.\n\n" +
                "Vuoi aprire le impostazioni?"
              )) {
                this.BackgroundGeolocation.openSettings();
              }
            }
            console.error(error);
            return;
          }

          if (!this.permissionChecked) {
            this.tracking = true;
            // Initialize the elapsed time to zero
            this.startTimer();
          }
          this.permissionChecked = true;

          if (this.tracking) {
            // Handle the location update
            this.bus.coords.latitude = location?.latitude || 0;
            this.bus.coords.longitude = location?.longitude || 0;

            // Update the Realtime Database with the new location
            if (this.bus.coords.latitude !== 0 && this.bus.coords.longitude !== 0) {
              this.updateRealTimeCoords(this.bus.coords, this.bus.direction, this.bus.lastStop, location?.speed);

              if (this.checkStopReached(this.bus.coords)) {
                try {
                  // Update the stop reached in the bus service
                  const data = await this.busService.updateStopReached(this.bus.route.id, this.bus.lastStop.toString(), this.bus.direction);
                  console.log('Stop reached: ', data);
                  let oldDirection = this.bus.direction;
                  let oldStop = this.bus.lastStop;
                  this.updateDirectionAndStop();
                  if (this.bus.direction != oldDirection || (this.onlyForward && oldStop === Object.keys(this.bus.route.stops.forwardStops).length - 1)) {
                    // Fix history gaps in the bus service
                    const fix = await this.busService.fixHistoryGaps(this.bus.route.id, oldDirection);
                    console.log('History gaps fixed: ', fix);
                    this.updateStopsAndDestination();
                  }

                } catch (error) {
                  console.error('Error updating stop reached', error);
                }
              }
            }
          } else {
            console.log('STOP TRACKING');
            // Remove the watcher from the BackgroundGeolocation plugin
            this.BackgroundGeolocation.removeWatcher({ id: this.watcherId }).then(() => {
              console.log('Watcher removed')
            });
            //this.permissionChecked = false;
          }
        }).then((watcherId) => {
          this.watcherId = watcherId; // Store the watcher ID
        });
      });
    } catch (error) {
      console.error('Error starting position tracking', error);
    }
  }

  /**
   * Updates the Realtime Database in Firebase with the new coordinates, direction, last stop and speed.
   * @param {Object} coords - The new coordinates object with latitude and longitude properties.
   * @param {string} direction - The new direction.
   * @param {number} lastStop - The new last stop number.
   * @param {number | null | undefined} speed - The new speed number, or null or undefined if not available.
   */
  updateRealTimeCoords(
    coords: {
      latitude: number;
      longitude: number;
    },
    direction: string,
    lastStop: number,
    speed: number | null | undefined,
  ) {
    // Update the Realtime Database in Firebase with the new coordinates, direction, last stop and speed
    const dbRef = ref(this.firebaseDB, 'buses/' + this.bus.id);
    set(dbRef, {
      coords: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
      direction: direction,
      lastStop: lastStop,
      speed: speed,
      routeId: this.bus.route.id,
    })
      .then(() => console.log('Position updated successfully'))
      .catch(error => console.error('Error updating position', error));
  }

  /**
   * Checks if the bus is near a stop.
   * 
   * @param {Object} busCoords - The current coordinates of the bus.
   * @return {boolean} True if the bus is near a stop, false otherwise.
   */
  checkStopReached(busCoords: any): boolean {
    // Check if the bus is near a stop
    let stopReached = false;

    // Check if the bus direction is defined and not empty
    if (this.bus.direction !== undefined && this.bus.direction !== '') {
      console.log("direction: ", this.bus.direction);

      // Get the stops for the current direction
      const stops = this.getStopsByDirection();

      // Iterate over the stops after the last stop
      for (let i = this.bus.lastStop + 1; i < stops.length; i++) { // Exclude the current stop
        const stop = stops[i];

        // Calculate the distance between the bus and the stop
        const distance = this.calculateDistance(
          busCoords.latitude,
          busCoords.longitude,
          stop.coords.latitude,
          stop.coords.longitude
        );

        // Check if the distance is less than the geofence radius and the stop is not the current stop
        if (distance < this.GEOFENCE_RADIUS && this.lastStopName != stop.name) { // 50m of distance
          console.log('Stop reached', stop);
          stopReached = true;
          this.bus.lastStop = i;
          this.lastStopName = stop.name;
          //this.updateDirectionAndStop();
          break;
        } else {
          console.log("Distance from [", stop.name, "]= ", distance);
        }
      }
    } else {
      console.log("direction NOT set");

      // Get the stops for the forward and back directions
      const stopsForward = this.bus.route.stops.forwardStops;
      const stopsBack = this.bus.route.stops.backStops;

      // Check if the bus is near a stop in the forward or back direction
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
      if (distance < this.GEOFENCE_RADIUS) { // 50m of distance
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

  /**
   * Updates the direction and stop of the bus.
   */
  updateDirectionAndStop() {
    // Check if the bus is going forward and it has reached the last stop in the forward direction
    if (this.bus.direction === 'forward' &&
        this.bus.lastStop === Object.keys(this.bus.route.stops.forwardStops).length - 1 &&
        !this.onlyForward) {
      // Switch to backward direction and reset the last stop and direction
      this.bus.direction = 'back';
      this.lastStopName = '';
      this.bus.lastStop = -1;
    } else if (this.bus.direction === 'back' &&
               this.bus.lastStop === Object.keys(this.bus.route.stops.backStops).length - 1) {
      // Switch to forward direction and reset the last stop and direction
      this.bus.direction = 'forward';
      this.lastStopName = '';
      this.bus.lastStop = -1;
    } else if (this.bus.direction === 'forward' &&
               this.bus.lastStop === Object.keys(this.bus.route.stops.forwardStops).length - 1 &&
               this.onlyForward) {
      // Stop the tracking
      this.stopTracking();
    } else if (this.bus.direction === '' &&
               this.bus.lastStop === Object.keys(this.bus.route.stops.forwardStops).length - 1 &&
               this.onlyForward) {
      // Stop the tracking
      this.stopTracking();
    } else if (this.bus.direction === '' &&
               this.bus.lastStop === Object.keys(this.bus.route.stops.forwardStops).length - 1 &&
               !this.onlyForward) {
      // Switch to backward direction and reset the last stop and direction
      this.bus.direction = 'back';
      this.lastStopName = '';
      this.bus.lastStop = -1;
    }
  }

  /**
   * Calculates the distance between two points on Earth (specified in decimal degrees)
   * using the Haversine formula.
   *
   * @param {number} lat1 - The latitude of the first point in decimal degrees.
   * @param {number} lon1 - The longitude of the first point in decimal degrees.
   * @param {number} lat2 - The latitude of the second point in decimal degrees.
   * @param {number} lon2 - The longitude of the second point in decimal degrees.
   * @return {number} The distance between the two points in kilometers.
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Radius of the Earth in kilometers
    const R = 6371;

    // Calculate the differences in latitude and longitude
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    // Calculate the Haversine formula
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    // Calculte distance in kilometers
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // In kilometers

    return d;
  }

  /**
   * Converts an angle from degrees to radians.
   * 
   * @param {number} deg - The angle in degrees.
   * @return {number} The angle in radians.
   */
  deg2rad(deg: number): number {
    // Convert degrees to radians by multiplying with the ratio of pi to 180.
    return deg * (Math.PI / 180);
  }

  /**
   * Requests confirmation from the user before stopping the tracking.
   * Displays an alert with a confirmation message and two buttons:
   * - Annulla: dismiss the alert without stopping the tracking
   * - Conferma: stop the tracking
   * @returns {Promise<void>}
   */
  async requestStopTracking() {
    const alert = await this.alertController.create({
      header: 'Conferma',
      message: 'Sei sicuro di voler interrompere il tracciamento?',
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel',
          handler: () => {
            // Cancel, do nothing
          }
        },
        {
          text: 'Conferma',
          handler: () => {
            // Confirm, stop tracking
            this.stopTracking();
          }
        }
      ]
    });

    await alert.present();
  }


  /**
   * Stops the tracking of the bus's position.
   * - Sets the tracking flag to false.
   * - Resets the direction and last stop of the bus.
   * - Clears the interval for updating the position.
   * - Resets the bus's coordinates to zero.
   * - Updates the Realtime Database in Firebase with the new coordinates, direction, last stop and speed.
   *
   * @returns {void}
   */
  stopTracking() {
    this.tracking = false; // Set tracking flag to false
    this.bus.direction = ''; // Reset direction
    this.bus.lastStop = -1; // Reset last stop
    this.lastStopName = ''; // Reset last stop name
    clearInterval(this.intervalId); // Clear the interval for updating the position
    this.bus.coords.latitude = 0; // Reset latitude coordinate to zero
    this.bus.coords.longitude = 0; // Reset longitude coordinate to zero
    this.updateRealTimeCoords(this.bus.coords, this.bus.direction, this.bus.lastStop, 0); // Update the Realtime Database in Firebase with the new coordinates, direction, last stop and speed
  }

  /**
   * Displays an alert to confirm user's intention to log out.
   * If user confirms, it performs the logout process.
   *
   * @return {Promise<void>} Promise that resolves when the alert is dismissed.
   */
  async logout() {
    // Create alert with confirmation message
    const alert = await this.alertController.create({
      header: 'Esci', // Header of the alert
      message: 'Sei sicuro di voler effettuare il logout?', // Message of the alert
      buttons: [
        {
          text: 'Annulla', // Text for cancel button
          role: 'cancel', // Role for cancel button
          handler: () => {
            // User has cancelled, do nothing
          }
        },
        {
          text: 'Esci', // Text for confirm button
          handler: () => {
            // User has confirmed, perform the logout
            this.performLogout();
          }
        }
      ]
    });

    // Present the alert
    await alert.present();
  }

  /**
   * Performs the actual logout process.
   * After the logout, the user is redirected to the login page without passing any parameters and the page is reloaded.
   *
   * @return {Promise<void>} Promise that resolves when the logout process is completed.
   */
  private async performLogout() {
    // Call the logout method from the login service
    await this.loginService.logout();

    // Redirect the user to the login page without passing any parameters and reload the page
    this.router.navigate(['login'], { replaceUrl: true });
  }

  /**
   * Updates the stops and destination based on the bus direction.
   * If the bus is going back, the stops are set to the back stops and the destination is obtained with back direction.
   * If the bus is not going back, the stops are set to the forward stops and the destination is obtained without direction.
   */
  updateStopsAndDestination() {
    // Check if the bus is going back
    if (this.bus.direction === "back") {
      // Set the stops to the back stops
      this.stops = Object.values(this.bus.route.stops.backStops);
      // Get the destination with back direction
      this.getDestination(true);
    } else {
      // Set the stops to the forward stops
      this.stops = Object.values(this.bus.route.stops.forwardStops);
      // Get the destination without direction
      this.destination = this.getDestination();
    }
  }

  /**
   * Returns the destination of the bus based on the bus direction.
   * If the bus is going back, the destination is obtained with back direction.
   * If the bus is not going back, the destination is obtained without direction.
   *
   * @param {boolean} back - Indicates if the bus is going back. Default is false.
   * @return {string} The destination of the bus.
   */
  getDestination(back = false): string {
    // Extract the code of the route
    let code = this.bus.route.code.split("_")[1];

    // Split the code by "-" and join the elements with " - " to create the destination string
    let destination = code.split("-")
      .map((element) => {
        return element.trim(); // Remove any leading or trailing whitespace
      })
      .join(" - ");

    // Check if the bus is going back and reverse the order of the destination elements
    if (back) {
      destination = destination.split(" - ").reverse().join(" - ");
    }

    return destination;
  }

  /**
   * Start the timer and update the timer value every second.
   */
  startTimer() {
    let elapsedTimeInSeconds = 0;

    // Start the interval and store the returned ID from setInterval()
    this.intervalId = setInterval(() => {
      // Increment the elapsed time in seconds
      elapsedTimeInSeconds++;
      // Calculate hours, minutes, and seconds
      const hours = Math.floor(elapsedTimeInSeconds / 3600);
      const minutes = Math.floor((elapsedTimeInSeconds % 3600) / 60);
      const seconds = elapsedTimeInSeconds % 60;

      // Format the time as "HH:MM:SS"
      const formattedTime = `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      // Update the timer value in the UI
      this.timerValue = formattedTime;
      // Force Angular to detect changes in the UI
      this.cdr.detectChanges();

    }, 1000); // Update every second
  }

  resizeModal() {
    this.accordionOpen = !this.accordionOpen;
    const breakpoint = this.accordionOpen ? 1 : 0.33;
    this.modal.setCurrentBreakpoint(breakpoint);
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


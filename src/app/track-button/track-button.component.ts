import { Component, OnInit, OnDestroy } from '@angular/core';
import { Geolocation, PositionOptions, GeolocationPosition } from '@capacitor/geolocation';
import { getDatabase, ref, set } from 'firebase/database';
import { initializeApp } from 'firebase/app';


@Component({
  selector: 'app-track-button',
  templateUrl: './track-button.component.html',
  styleUrls: ['./track-button.component.scss'],
})
export class TrackButtonComponent implements OnInit, OnDestroy {

  currentPosition: GeolocationPosition | undefined;
  watchId: string | undefined;
  tracking = false;
  firebaseDB: any;


  constructor() {
    // Inizializza il Realtime Database di Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyAXBzmUtfz_xcBTMmhcEvQdWO1GEArn5wA",
      authDomain: "busbus-19997.firebaseapp.com",
      databaseURL: "https://busbus-19997-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "busbus-19997",
      storageBucket: "busbus-19997.appspot.com",
      messagingSenderId: "1044655569384",
      appId: "1:1044655569384:web:f01efa60cfd6d7cfca0c5d",
      measurementId: "G-91JVDWWYCN"
    };

    this.firebaseDB = getDatabase(initializeApp(firebaseConfig));
  }

  ngOnInit() {
    this.getCurrentPosition();
  }

  ngOnDestroy() {
    // Quando il componente viene distrutto, smetti di tracciare la posizione
    this.stopTracking();
  }

  async getCurrentPosition() {
    try {
      const permissionStatus = await Geolocation.checkPermissions();
      if (permissionStatus.location !== 'granted') {
        const requestStatus = await Geolocation.requestPermissions();
        if (requestStatus.location !== 'granted') {
          throw new Error('Permission not granted');
        }
      }

      const options: PositionOptions = {
        enableHighAccuracy: true
      };
      this.currentPosition = await Geolocation.getCurrentPosition(options);
    } catch (error) {
      console.error('Error getting current position', error);
    }
  }

  async startTracking() {
    try {
      const permissionStatus = await Geolocation.checkPermissions();
      if (permissionStatus.location !== 'granted') {
        const requestStatus = await Geolocation.requestPermissions();
        if (requestStatus.location !== 'granted') {
          throw new Error('Permission not granted');
        }
      }

      const options: PositionOptions = {
        enableHighAccuracy: true
      };
      // Avvia il tracciamento della posizione e memorizza l'ID del watcher
      this.tracking = true;
      this.watchId = await Geolocation.watchPosition(options, (position, err) => {
        if (err) {
          console.error('Error watching position', err);
        } else {
          this.currentPosition = position || undefined;
          // Aggiorna il Realtime Database di Firebase con la nuova posizione
          if (this.currentPosition) {
            console.log('Updating position', this.currentPosition);
            this.updateFirebaseDatabase(this.currentPosition);
          }
        }
      });
    } catch (error) {
      console.error('Error starting position tracking', error);
    }
  }

  updateFirebaseDatabase(position: GeolocationPosition) {
    // Aggiorna il Realtime Database di Firebase con la nuova posizione
    const dbRef = ref(this.firebaseDB, 'buses/bus1/coords');
    set(dbRef, {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    })
    .then(() => console.log('Position updated successfully'))
    .catch(error => console.error('Error updating position', error));
  }

  stopTracking() {
    // Interrompi il tracciamento della posizione se è attivo
    this.tracking = false;
    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
    }
  }
}

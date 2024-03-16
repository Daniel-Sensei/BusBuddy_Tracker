import { Component, OnInit, OnDestroy } from '@angular/core';
import { Geolocation, PositionOptions, GeolocationPosition } from '@capacitor/geolocation';
import { Firestore } from '@angular/fire/firestore';
import { GeoPoint, collection, doc, setDoc } from 'firebase/firestore';
import { updateDoc } from 'firebase/firestore';

@Component({
  selector: 'app-track-button',
  templateUrl: './track-button.component.html',
  styleUrls: ['./track-button.component.scss'],
})
export class TrackButtonComponent implements OnInit, OnDestroy {

  currentPosition: GeolocationPosition | undefined;
  watchId: string | undefined;
  tracking = false;

  constructor(private firestore: Firestore) { }

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
          // Aggiorna il database Firebase con la nuova posizione
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

  // ...

  updateFirebaseDatabase(position: GeolocationPosition) {
    // Aggiorna il database Firebase con la nuova posizione
    const busesCollection = collection(this.firestore, 'buses');
    // Aggiorna il bus con id 1
    const busDoc = doc(busesCollection, '1');

    // Creazione di un oggetto GeoPoint
    const geoPoint = new GeoPoint(position.coords.latitude, position.coords.longitude);

    // Aggiornamento del documento con il campo coords
    updateDoc(busDoc, {
      coords: geoPoint
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

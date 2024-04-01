import { Injectable } from '@angular/core';
import { getAuth, Auth, signInWithEmailAndPassword } from 'firebase/auth';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor() { }

  public async login(email: string, password: string): Promise<string | null> {
    const auth: Auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Accesso riuscito, restituisci l'ID token dell'utente
      const user = userCredential.user;
      const idToken = await user.getIdToken();
      
      // Salvataggio del token in Preferences
      await Preferences.set({
        key: 'authToken',
        value: idToken
      });

      return idToken;
    } catch (error) {
      console.error('Errore durante il login:', error);
      console.log("PASSO ERRORE");
      throw error; // Rethrow the error to be handled by the calling function
    }
  }

  public async setBusCode(busCode: string): Promise<void> {
    try {
      await Preferences.set({
        key: 'busCode',
        value: busCode
      });
    } catch (error) {
      console.error('Errore durante il salvataggio del codice del pullman:', error);
    }
  }

  public async getBusCode(): Promise<string> {
    try {
      const result = await Preferences.get({ key: 'busCode' });
      return result.value || ''; // Restituisce il codice del pullman se presente, altrimenti una stringa vuota
    } catch (error) {
      console.error('Errore durante il recupero del codice del pullman:', error);
      return '';
    }
  }

  public async getToken(): Promise<string> {
    try {
      const result = await Preferences.get({ key: 'authToken' });
      return result.value || ''; // Restituisce il token se presente, altrimenti una stringa vuota
    } catch (error) {
      console.error('Errore durante il recupero del token:', error);
      return '';
    }
  }

  //implemneta isLoggedin
  public async isLoggedIn(): Promise<boolean> {
    try {
      const token = await this.getToken();
      return token !== '';
    } catch (error) {
      console.error('Errore durante il controllo dello stato di accesso:', error);
      return false;
    }
  }

  public async logout(): Promise<void> {
    try {
      await Preferences.remove({ key: 'authToken' });
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  }
}

import { Injectable } from '@angular/core';
import { getAuth, Auth, signInWithEmailAndPassword } from 'firebase/auth';
import { Preferences } from '@capacitor/preferences';
import { Plugins } from '@capacitor/core';
const { CapacitorHttp } = Plugins;


@Injectable({
  providedIn: 'root'
})
export class LoginService {
  
readonly BACKEND_API = 'https://bus-bus.onrender.com/';

  constructor() { }

  public async verifyTokenIntegrity(token: string): Promise<boolean> {
    const headers = {
      'Content-Type': 'application/json'
    };
    const data = { token: token };
  
    const response = await CapacitorHttp['post']({
      url: this.BACKEND_API + "verifyTokenIntegrity",
      data: data,
      headers: headers
    });
  
    return response.data;
  }

  public async login(email: string, password: string): Promise<string | null> {
    const auth: Auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Accesso riuscito, restituisci l'ID token dell'utente
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      return idToken;
    } catch (error) {
      console.error('Errore durante il login:', error);
      console.log("PASSO ERRORE");
      throw error; // Rethrow the error to be handled by the calling function
    }
  }

  public async saveToken(token: string): Promise<void> {
    try {
      await Preferences.set({
        key: 'authToken',
        value: token
      });
    } catch (error) {
      console.error('Errore durante il salvataggio del token:', error);
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

  public async saveBusCode(busCode: string): Promise<void> {
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

  //implemneta isLoggedin
  public async isLoggedIn(): Promise<boolean> {
    try {
      const token = await this.getToken();
      const isTokenValid = await this.verifyTokenIntegrity(token);
      return isTokenValid;
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

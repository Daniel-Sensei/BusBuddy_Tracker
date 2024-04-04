import { Injectable } from '@angular/core';
import { getAuth, Auth, signInWithEmailAndPassword, signInWithCustomToken } from 'firebase/auth';
import { Preferences } from '@capacitor/preferences';
import { environment } from 'src/environments/environment';
import { Plugins } from '@capacitor/core';
const { CapacitorHttp } = Plugins;


@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor() { }

  public async generateCustomToken(uid: string): Promise<string> {
    const response = await CapacitorHttp['get']({
      url: environment.BACKEND_API + "generate-custom-token",
      params: { uid: uid }
    });
    return response.data;
  }

  public async verifyCustomToken(token: string): Promise<boolean> {
    //passa nell'header il token nel campo Authorization
    //il token deve essere preceduto dalla stringa "Bearer "
    const headers
      = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    };
    const response = await CapacitorHttp['get']({
      url: environment.BACKEND_API + "verify-custom-token",
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
      console.log("uid: ", user.uid);
      const customToken = await this.generateCustomToken(user.uid);
      console.log("customToken: ", customToken);

      return customToken;
    } catch (error) {
      console.error('Errore durante il login:', error);
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

  public async isLoggedIn(): Promise<boolean> {
    try {
      const token = await this.getToken();
      const isTokenValid = await this.verifyCustomToken(token);
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

import { Injectable } from '@angular/core';
import { getAuth, Auth, signInWithEmailAndPassword } from 'firebase/auth';

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
      return user.getIdToken();
    } catch (error) {
      console.error('Errore durante il login:', error);
      return null;
    }
  }
}

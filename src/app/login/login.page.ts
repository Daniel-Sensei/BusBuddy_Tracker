import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../service/login.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
})
export class LoginPage {
  email!: string;
  password!: string;

  constructor(private loginService: LoginService, private router: Router) {}

  async login() {
    try {
      this.loginService.login(this.email, this.password).then((token) => {
        if (token) {
          // Accesso riuscito, reindirizza l'utente alla pagina principale
          this.router.navigate(['']);
        } else {
          // Accesso fallito, mostra un messaggio di errore all'utente
        }
      });
    } catch (error) {
      console.error('Errore durante il login:', error);
      // Gestisci l'errore di autenticazione qui, ad esempio mostrando un messaggio di errore all'utente
    }
  }
}

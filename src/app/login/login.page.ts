import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../service/login.service';
import { NavigationExtras } from '@angular/router';
import { BusService } from '../service/bus.service';


@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
})
export class LoginPage {
  email!: string;
  password!: string;

  emailValid: boolean = false;
  emailInputClass: string = '';

  passwordValid: boolean = false;
  passwordInputClass: string = '';

  credentialsWrong: boolean = false;

  constructor(private loginService: LoginService, private router: Router) { }

  async login() {

    this.loginService.login(this.email, this.password).then((token) => {
      if (token) {
        // Costruisci l'oggetto NavigationExtras per passare il token come parametro query
        const navigationExtras: NavigationExtras = {
          queryParams: {
            token: token,
            email: this.email
          }
        };

        // Reindirizza l'utente alla pagina bus-selection con il token come parametro query
        this.router.navigate(['/bus-selection'], navigationExtras);
      }
    }, (error) => {
      console.error('Errore durante il login!');
      this.credentialsWrong = true;
    });

  }


  validateEmail() {
    // Utilizza una semplice espressione regolare per controllare se l'email è valida
    this.emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
    // Imposta la classe CSS in base alla validità dell'email
    this.emailInputClass = this.emailValid ? 'valid-input' : 'invalid-input';

    this.credentialsWrong = false;
  }

  validatePassword() {
    // Controlla se la password è stata inserita
    this.passwordValid = Boolean(this.password && this.password.trim() !== '');
    // Imposta la classe CSS in base alla validità della password
    this.passwordInputClass = this.passwordValid ? 'valid-input' : 'invalid-input';

    this.credentialsWrong = false;
  }
}

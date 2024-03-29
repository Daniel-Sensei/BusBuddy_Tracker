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

  constructor(private loginService: LoginService, private router: Router) {}

  async login() {
    try {
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
      });
    } catch (error) {
      console.error('Errore durante il login:', error);
      // Gestisci l'errore di autenticazione qui, ad esempio mostrando un messaggio di errore all'utente
    }
  }
}

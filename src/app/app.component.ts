import { Component } from '@angular/core';
import { LoginService } from './service/login.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(private loginService: LoginService, private router: Router) {}

  logout() {
    document.querySelector('ion-menu')?.close();
    this.loginService.logout().then(() => {
      console.log('Logout effettuato');
      // Reindirizza l'utente alla pagina di login
      this.router.navigateByUrl('/login');
    });
  }
}

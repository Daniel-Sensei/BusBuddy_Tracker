import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { LoginService } from './service/login.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private loginService: LoginService) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      return this.checkLogin(state.url);
  }

  async checkLogin(url: string): Promise<boolean | UrlTree> {
    const isLoggedIn = await this.loginService.isLoggedIn();
    if (isLoggedIn) {
      return true;
    } else {
      // Reindirizza l'utente alla pagina di login
      return this.router.parseUrl('/login');
    }
  }
}

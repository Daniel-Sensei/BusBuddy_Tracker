import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../service/login.service';
import { NavigationExtras } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
})
export class LoginPage {
  email!: string;
  password!: string;

  emailValid: boolean = false;
  passwordValid: boolean = false;

  credentialsWrong: boolean = false;

  constructor(private loginService: LoginService, private router: Router) { }

  /**
   * Function to handle the login process.
   * It calls the login service, passing the email and password, and then redirects
   * the user to the bus-selection page, including the token and email as query parameters.
   * If the login fails, it shows an error message.
   */
  async login() {

    // Call the login service to authenticate the user
    this.loginService.login(this.email, this.password)
      .then((token) => {

        // If the login is successful, navigate to the bus-selection page
        if (token) {

          // Create the NavigationExtras object to pass the token and email as query parameters
          const navigationExtras: NavigationExtras = {
            queryParams: {
              token: token,
              email: this.email
            }
          };

          // Redirect the user to the bus-selection page, including the token and email as query parameters
          this.router.navigate(['/bus-selection'], navigationExtras);
        }
      })
      .catch((error) => {

        // If the login fails, show an error message
        console.error('Errore durante il login!');
        this.credentialsWrong = true;
      });
  }

  /**
   * Validates the email address using a simple regular expression.
   * 
   * This function checks if the email address is valid by using a regular expression
   * pattern that matches the basic format of an email address. It sets the `emailValid`
   * property to `true` if the email is valid and `false` otherwise. Additionally, it
   * sets the `credentialsWrong` property to `false` to indicate that the login credentials
   * are not wrong.
   */
  validateEmail() {
    // The regular expression pattern matches the basic format of an email address
    // It checks if the email address does not contain whitespace or the '@' symbol
    // and if it has a valid domain and a valid top-level domain
    this.emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
    
    // Reset the credentialsWrong property to false
    this.credentialsWrong = false;
  }

  /**
   * Validates the password by checking if it has been entered.
   * 
   * This function checks if the password has been entered by checking if it exists
   * and if it is not empty after trimming any leading or trailing whitespace.
   * It sets the `passwordValid` property to `true` if the password is valid and
   * `false` otherwise. Additionally, it sets the `credentialsWrong` property to
   * `false` to indicate that the login credentials are not wrong.
   */
  validatePassword() {
    // Check if the password has been entered by checking if it exists and if it is not empty after trimming any leading or trailing whitespace
    this.passwordValid = Boolean(this.password && this.password.trim() !== '');
    
    // Reset the credentialsWrong property to false
    this.credentialsWrong = false;
  }
}

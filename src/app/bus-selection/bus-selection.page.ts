import { Component, Input, OnInit } from '@angular/core';
import { BusService } from '../service/bus.service';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { LoginService } from '../service/login.service';




@Component({
  selector: 'app-bus-selection',
  templateUrl: './bus-selection.page.html',
  styleUrls: ['./bus-selection.page.scss'],
})
export class BusSelectionPage implements OnInit {
  token: string = ''; // Variable to store the token
  email: string = ''; // Variable to store the email

  company: string = ''; // Variable to store the company name
  busCode: string = ''; // Variable to store the bus code
  selectedLine?: string; // Variable to store the selected line

  lines: any[] = []; // Example of array of available lines
  routes: any[] = []; // Example of array of available routes

  busCodeValid: boolean = false; // Variable to store the state of bus code error
  lineSelected: boolean = false; // Variable to store the state of selected line error

  credentialsWrong: boolean = false; // Variable to store the state of credentials error
  credentialsRight: boolean = false; // Variable to store the state of correct credentials

  loading: boolean = false; // Variable to store the state of loading

  constructor(private busService: BusService, private route: ActivatedRoute, private router: Router, private loginService: LoginService) { }

  /**
   * Initializes the component and retrieves the token and email from the route parameters.
   * Then it calls the BusService to get the company by email.
   */
  ngOnInit() {
    // Retrieve the token and email from the route parameters
    this.route.queryParams.subscribe(params => {
      this.token = params['token']; // Store the token
      this.email = params['email']; // Store the email
      console.log('Token in BusSelectionPage:', this.token); // Log the token
      console.log('Email:', this.email); // Log the email

      // Call the BusService to get the company by email
      this.busService.getCompanyByEmail(this.email)
        .then((company) => {
          this.company = company; // Store the company
          console.log('Company:', company); // Log the company
        });
    });
  }

  /**
   * Handles the change of the bus code input field.
   * Fetches the routes for the bus code and updates the available lines.
   */
  onBusCodeChange() {
    // Log the changed bus code
    console.log('Codice pullman cambiato:', this.busCode);

    // Set the loading state to true
    this.loading = true;

    // Fetch the routes for the bus code
    this.busService.getRoutesByBusCode(this.busCode)
      .then((routes) => {
        // Set the loading state to false
        this.loading = false;

        // Check if routes are found
        if (routes.length > 0) {
          // Log the found routes
          console.log('Rotte trovate per il pullman', routes);

          // Reset the error states
          this.credentialsWrong = false;
          this.credentialsRight = true;

          // Check if the first route belongs to the company
          if (routes[0].company == this.company) {
            // Store the routes
            this.routes = routes;

            // Log the routes
            console.log('Rotte per il pullman', routes);

            // Update the available lines based on the routes
            this.lines = [];
            for (let route of routes) {
              // Format the route code
              route.code = route.code.split('_').join(' ');
              this.lines.push(route);
            }
          } else {
            // Log that the bus does not belong to the company
            console.log('Il pullman non appartiene alla compagnia');
          }
        } else {
          // Log that no routes were found for the bus code
          console.log('Nessuna rotta trovata per il pullman');

          // Reset the error states
          this.credentialsWrong = true;
          this.credentialsRight = false;

          // Clear the available lines
          this.lines = [];
        }
      });
  }

  /**
   * Handles the selection of a bus.
   * This function should implement the logic to handle the selection of a bus.
   * For example, it can send the bus code and selected line to the service for your business logic.
   */
  onSelectBus() {
    // Log the selected bus code
    console.log('Codice pullman:', this.busCode);
    // Log the selected line
    console.log('Linea selezionata:', this.selectedLine);

    // Get the route ID based on the selected line
    let routeId = '';
    for (let route of this.routes) {
      // Log the current route and selected line
      console.log('route:', route.code, this.selectedLine);
      // Check if the current route ID matches the selected line
      if (route.id === this.selectedLine) {
        routeId = route.id;
        break;
      }
    }
    // Log the obtained route ID
    console.log('RouteId:', routeId);

    // Update the bus route using the bus code and route ID
    this.busService.updateBusRoute(this.busCode, routeId).then((result) => {
      // Log the result of the bus route update
      console.log('Risultato dell\'aggiornamento del percorso del pullman:', result);

      // Save the token and bus code using the login service
      this.loginService.saveToken(this.token).then(() => {
        this.loginService.saveBusCode(this.busCode).then(() => {
          // Redirect the user to the home page without passing any parameters and reload the page
          this.router.navigate([''], { replaceUrl: true });
        });
      });
    });
  }

  /**
   * Validates the bus code.
   * Sets the busCodeValid flag based on the validity of the bus code.
   * Resets the credentialsWrong flag.
   */
  validateBusCode() {
    // Check if the bus code is not empty or consists of only whitespace
    this.busCodeValid = Boolean(this.busCode && this.busCode.trim() !== '');

    // Reset the credentialsWrong flag
    this.credentialsWrong = false;
  }

  /**
   * Handles the change event of the line selection.
   * Updates the selectedLine property with the ID of the selected line.
   * Logs the selected line ID to the console.
   *
   * @param event - The event object containing the selected line's ID.
   */
  handleChangeLine(event: any) {
    // Update the selectedLine property with the ID of the selected line
    this.selectedLine = event.target.value.id;

    // Log the selected line ID to the console
    console.log('Linea selezionata:', this.selectedLine);
  }
}

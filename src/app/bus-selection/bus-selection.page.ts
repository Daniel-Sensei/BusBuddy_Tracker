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
  token: string = ''; // Variabile per memorizzare il token
  email: string = ''; // Variabile per memorizzare l'email

  company: string = ''; // Variabile per memorizzare il nome della compagnia
  busCode: string = ''; // Variabile per memorizzare il codice del pullman
  selectedLine?: string; // Variabile per memorizzare la linea selezionata

  lines: string[] = []; // Esempio di array di linee disponibili
  routes: any[] = []; // Esempio di array di rotte disponibili

  constructor(private busService: BusService, private route: ActivatedRoute, private router: Router, private loginService: LoginService) { }

  ngOnInit() {
    // Recupera il token dai parametri della route
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.email = params['email'];
      console.log('Token Nel bus-selection:', this.token);
      console.log('Email:', this.email);
      this.busService.getCompanyByEmail(this.email).then((company) => {
        this.company = company;
        console.log('Compagnia:', company);
      });
    });
  }

  onBusCodeChange() {
    console.log('Codice pullman cambiato:', this.busCode);
    this.busService.getRoutesByBusCode(this.busCode).then((routes) => {
      if (routes[0].company == this.company) {
        this.routes = routes;
        console.log('Rotte per il pullman', routes);
        // Qui puoi aggiornare l'elenco delle linee disponibili in base alle rotte ottenute
        for (let route of routes) {
          this.lines.push(route.code);
        }
      } else {
        console.log('Il pullman non appartiene alla compagnia');
      }
    });
  }

  onSelectBus() {
    // Qui puoi implementare la logica per gestire la selezione del pullman
    // Ad esempio, puoi inviare il codice del pullman e la linea selezionata al servizio per il tuo business logic
    console.log('Codice pullman:', this.busCode);
    console.log('Linea selezionata:', this.selectedLine);

    //salva routeId in base alla linea selezionata
    let routeId = '';
    for (let route of this.routes) {
      if (route.code == this.selectedLine) {
        routeId = route.id;
        break;
      }
    }
    console.log('RouteId:', routeId);
    this.busService.updateBusRoute(this.busCode, routeId).then((result) => {
      console.log('Risultato dell\'aggiornamento del percorso del pullman:', result);

      this.loginService.setBusCode(this.busCode).then(() => {
        // Reindirizza l'utente alla pagina bus-selection con il token come parametro query
        this.router.navigate(['']);
      });
    });
  }
}

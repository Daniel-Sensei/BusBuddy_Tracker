import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BusService {

  readonly BACKEND_API = 'http://localhost:8080/';

  constructor(private http: HttpClient) { }

  public getStopsByBus(busId: string): Observable<any> {
    return this.http.get(this.BACKEND_API + "stopsByBus?busId=" + busId);
  }

  public getBusByCode(code: string, token: string): Observable<any> {
    const body = { code: code, token: token };
    return this.http.post(this.BACKEND_API + "busByCode", body);
  }

  public updateStopReached(routeId: string, stopIndex: string, direction: string): Observable<boolean> {
    return this.http.post<boolean>(this.BACKEND_API + "stopReached?routeId=" + routeId + "&stopIndex=" + stopIndex + "&direction=" + direction, null);
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Plugins } from '@capacitor/core';
const { CapacitorHttp } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class BusService {

  readonly BACKEND_API = 'https://bus-bus.onrender.com/';

  constructor() { }

  public async getStopsByBus(busId: string): Promise<any> {
    const response = await CapacitorHttp['get']({
      url: this.BACKEND_API + "stopsByBus",
      params: { busId: busId }
    });
    return response.data;
  }

  public async getBusByCode(code: string, token: string): Promise<any> {
    const headers = {
      'Content-Type': 'application/json'
    };
    const data = { code: code, token: token };
  
    const response = await CapacitorHttp['post']({
      url: this.BACKEND_API + "busByCode",
      data: data,
      headers: headers
    });
  
    return response.data;
  }
  

  public async updateStopReached(routeId: string, stopIndex: string, direction: string): Promise<boolean> {
    const response = await CapacitorHttp['post']({
      url: this.BACKEND_API + "stopReached",
      params: { routeId: routeId, stopIndex: stopIndex, direction: direction }
    });
    return response.data;
  }
}

import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Plugins } from '@capacitor/core';
const { CapacitorHttp } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class BusService {

  constructor() { }

  public async getCompanyByEmail(email: string): Promise<any> {
    const response = await CapacitorHttp['get']({
      url: environment.BACKEND_API + "companyByEmail",
      params: { email: email }
    });
    return response.data;
  }

  public async getBusByCode(code: string, token: string): Promise<any> {
    const headers = {
      'Content-Type': 'application/json'
    };
    const data = { code: code, token: token };
  
    const response = await CapacitorHttp['post']({
      url: environment.BACKEND_API + "busByCode",
      data: data,
      headers: headers
    });
  
    return response.data;
  }

  public async updateBusRoute(busCode: string, routeId: string): Promise<Boolean> {
    const response = await CapacitorHttp['post']({
      url: environment.BACKEND_API + "updateBusRoute",
      params: { busCode: busCode, routeId: routeId }
    });
    return response.data;
  }

  public async getRoutesByBusCode(busCode: string): Promise<any> {
    const response = await CapacitorHttp['get']({
      url: environment.BACKEND_API + "routesByBusCode",
      params: { busCode: busCode }
    });
    return response.data;
  }

  public async getStopsByBus(busId: string): Promise<any> {
    const response = await CapacitorHttp['get']({
      url: environment.BACKEND_API + "stopsByBus",
      params: { busId: busId }
    });
    return response.data;
  }
  
  public async updateStopReached(routeId: string, stopIndex: string, direction: string): Promise<boolean> {
    const response = await CapacitorHttp['post']({
      url: environment.BACKEND_API + "stopReached",
      params: { routeId: routeId, stopIndex: stopIndex, direction: direction }
    });
    return response.data;
  }

  public async fixHistoryGaps(routeId: string, direction: string): Promise<boolean> {
    const response = await CapacitorHttp['post']({
      url: environment.BACKEND_API + "fixHistoryGaps",
      params: { routeId: routeId, direction: direction }
    });
    return response.data;
  }
}

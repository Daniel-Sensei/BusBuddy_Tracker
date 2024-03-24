import { Route } from './Route';

export interface Bus {
    id: string;
    code: string;
    coords: {
        latitude: number;
        longitude: number;
    };

    route: Route;
    direction: string;
    lastStop: number;
}
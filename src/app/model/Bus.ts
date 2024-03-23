export interface Bus {
    id: string;
    coords: {
        latitude: number;
        longitude: number;
    };

    stops: {
        forwardStops: {
        };
        backStops: {
        }
    };

    routeId: string;
    direction: string;
    lastStop: number;
}
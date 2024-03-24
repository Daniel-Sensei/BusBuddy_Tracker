export interface Bus {
    id: string;
    code: string;
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
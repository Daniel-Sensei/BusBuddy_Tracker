export interface Route {
    id: string;
    company: string;
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
}
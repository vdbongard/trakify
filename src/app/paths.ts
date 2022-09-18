import { path } from 'static-path';

export const login = path('/login');
export const redirect = path('/redirect');

export const shows = path('/series');
export const addShow = path('/series/add-series');
export const search = path('/series/search');
export const upcoming = path('/series/upcoming');
export const watchlist = path('/series/watchlist');
export const show = path('/series/s/:slug');
export const season = path('/series/s/:slug/season/:season');
export const episode = path('/series/s/:slug/season/:season/episode/:episode');

export const lists = path('/lists');

export const statistics = path('/statistics');

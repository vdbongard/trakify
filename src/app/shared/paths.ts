import { path } from 'static-path';

export const login = path('/login');
export const loginNew = path('/login-new');
export const redirect = path('/redirect');
export const about = path('/about');

export const shows = path('/shows');
export const showsProgress = path('/shows/progress');
export const addShow = path('/shows/add-show');
export const search = path('/shows/search');
export const upcoming = path('/shows/upcoming');
export const watchlist = path('/shows/watchlist');
export const show = path('/shows/s/:show');
export const season = path('/shows/s/:show/season/:season');
export const episode = path('/shows/s/:show/season/:season/episode/:episode');

export const lists = path('/lists');

export const statistics = path('/statistics');

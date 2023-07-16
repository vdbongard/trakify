import { HttpInterceptorFn } from '@angular/common/http';
import { Config } from '../config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(Config.traktBaseUrl)) {
    const traktReq = req.clone({
      setHeaders: Config.traktOptions.headers as Record<string, string>,
    });
    return next(traktReq);
  }

  if (req.url.startsWith(Config.tmdbBaseUrl)) {
    const traktReq = req.clone({
      setHeaders: Config.tmdbOptions.headers as Record<string, string>,
    });
    return next(traktReq);
  }

  return next(req);
};

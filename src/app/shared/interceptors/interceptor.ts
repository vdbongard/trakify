import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Config } from '../../config';

@Injectable()
export class Interceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (req.url.startsWith(Config.traktBaseUrl)) {
      const traktReq = req.clone({
        setHeaders: Config.traktOptions.headers as { [header: string]: string },
      });
      return next.handle(traktReq);
    }

    if (req.url.startsWith(Config.tmdbBaseUrl)) {
      const traktReq = req.clone({
        setHeaders: Config.tmdbOptions.headers as { [header: string]: string },
      });
      return next.handle(traktReq);
    }

    return next.handle(req);
  }
}

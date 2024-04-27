import type { HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';

export interface HttpOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  context?: HttpContext;
  observe?: 'body';
  params?:
    | HttpParams
    | Record<string, string | number | boolean | readonly (string | number | boolean)[]>;
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
}

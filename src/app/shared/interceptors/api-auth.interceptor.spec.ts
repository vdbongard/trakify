import { HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { apiAuthInterceptor } from './api-auth.interceptor';
import { Config } from '../config';

describe('apiAuthInterceptor', () => {
  it('should add trakt headers for trakt URLs', () => {
    const req = new HttpRequest('GET', `${Config.traktBaseUrl}/shows`);
    const next = vi.fn((request: HttpRequest<unknown>) =>
      of(new HttpResponse({ body: request, status: 200 })),
    );

    apiAuthInterceptor(req, next);

    expect(next).toHaveBeenCalledTimes(1);
    const [clonedReq] = next.mock.calls[0]!;

    expect(clonedReq.headers.get('trakt-api-version')).toBe('2');
    expect(clonedReq.headers.get('trakt-api-key')).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should add tmdb headers for tmdb URLs', () => {
    const req = new HttpRequest('GET', `${Config.tmdbBaseUrl}/movie`);
    const next = vi.fn((request: HttpRequest<unknown>) =>
      of(new HttpResponse({ body: request, status: 200 })),
    );

    apiAuthInterceptor(req, next);

    expect(next).toHaveBeenCalledTimes(1);
    const [clonedReq] = next.mock.calls[0]!;

    expect(clonedReq.headers.get('Authorization')).toMatch(/^Bearer\s+\S+$/);
  });

  it('should pass through request unchanged for other URLs', () => {
    const req = new HttpRequest('GET', 'https://api.example.com/data');
    const next = vi.fn((request: HttpRequest<unknown>) =>
      of(new HttpResponse({ body: request, status: 200 })),
    );

    apiAuthInterceptor(req, next);

    expect(next).toHaveBeenCalledWith(req);
  });
});

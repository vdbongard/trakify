import { HttpRequest } from '@angular/common/http';
import { apiAuthInterceptor } from './api-auth.interceptor';
import { Config } from '../config';

describe('apiAuthInterceptor', () => {
  it('should add trakt headers for trakt URLs', () => {
    const req = new HttpRequest('GET', `${Config.traktBaseUrl}/shows`);
    const next = vi.fn().mockReturnValue({} as never);
    apiAuthInterceptor(req, next);
    const clonedReq = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(clonedReq.headers.get('trakt-api-version')).toBe('2');
    expect(clonedReq.headers.get('trakt-api-key')).toBeTruthy();
  });

  it('should add tmdb headers for tmdb URLs', () => {
    const req = new HttpRequest('GET', `${Config.tmdbBaseUrl}/movie`);
    const next = vi.fn().mockReturnValue({} as never);
    apiAuthInterceptor(req, next);
    const clonedReq = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(clonedReq.headers.get('Authorization')).toBeTruthy();
  });

  it('should pass through request unchanged for other URLs', () => {
    const req = new HttpRequest('GET', 'https://api.example.com/data');
    const next = vi.fn().mockReturnValue({} as never);
    apiAuthInterceptor(req, next);
    expect(next).toHaveBeenCalledWith(req);
  });
});

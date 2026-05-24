import { getUrl } from './getUrl';
import { Router, NavigationEnd, RouterEvent } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

describe('getUrl', () => {
  it('should return signal of url after redirects', () => {
    const eventsSubject = new Subject<RouterEvent>();
    const mockRouter = {
      events: eventsSubject.asObservable(),
    } as unknown as Router;

    TestBed.runInInjectionContext(() => {
      const urlSignal = getUrl(mockRouter);
      expect(urlSignal()).toBe('');

      eventsSubject.next(new NavigationEnd(1, '/test', '/test-redirected'));
      expect(urlSignal()).toBe('/test-redirected');
    });
  });
});

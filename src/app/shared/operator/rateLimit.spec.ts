import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { delayedResponse, retryAfter429 } from '@shared/mocks/mockRateLimit';
import { DEFAULT_RATE_LIMIT_CONFIG, RateLimitConfig, rateLimit } from './rateLimit';

describe('rateLimit', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('concurrency', () => {
    it('never exceeds the configured number of requests in flight', async () => {
      vi.useFakeTimers();

      const config: RateLimitConfig = { ...DEFAULT_RATE_LIMIT_CONFIG, concurrency: 8 };
      const tracking = { inFlight: 0, maxInFlight: 0 };

      const resultsPromise = Promise.all(
        Array.from({ length: 12 }, (_, value) =>
          firstValueFrom(delayedResponse(value, 100, tracking).pipe(rateLimit(config))),
        ),
      );

      await vi.advanceTimersByTimeAsync(1000);

      await expect(resultsPromise).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      expect(tracking.maxInFlight).toBeLessThanOrEqual(config.concurrency);
      expect(tracking.maxInFlight).toBe(config.concurrency);
      expect(tracking.inFlight).toBe(0);
    });
  });

  describe('429 retry', () => {
    it('retries a 429 honoring Retry-After and succeeds after exponential backoff', async () => {
      vi.useFakeTimers();

      let calls = 0;
      const config: RateLimitConfig = { ...DEFAULT_RATE_LIMIT_CONFIG, random: () => 0.5 };
      const source = new Observable<number>((subscriber) => {
        calls += 1;
        if (calls < 3) {
          subscriber.error(retryAfter429('1'));
          return;
        }
        subscriber.next(42);
        subscriber.complete();
      });

      const resultPromise = firstValueFrom(source.pipe(rateLimit(config)));

      await vi.advanceTimersByTimeAsync(0);
      expect(calls).toBe(1);

      // First retry waits `clamp(1s) * 2^0 * 1.0` = 1000ms.
      await vi.advanceTimersByTimeAsync(999);
      expect(calls).toBe(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(calls).toBe(2);

      // Second retry waits `clamp(1s) * 2^1 * 1.0` = 2000ms.
      await vi.advanceTimersByTimeAsync(1999);
      expect(calls).toBe(2);
      await vi.advanceTimersByTimeAsync(1);
      expect(calls).toBe(3);

      await expect(resultPromise).resolves.toBe(42);
    });

    it('drops a request after 3 consecutive 429 responses', async () => {
      vi.useFakeTimers();

      let calls = 0;
      const config: RateLimitConfig = { ...DEFAULT_RATE_LIMIT_CONFIG, random: () => 0.5 };
      const source = new Observable<number>((subscriber) => {
        calls += 1;
        subscriber.error(retryAfter429('1'));
      });

      const resultPromise = firstValueFrom(source.pipe(rateLimit(config)));
      const rejection = expect(resultPromise).rejects.toMatchObject({ status: 429 });

      await vi.advanceTimersByTimeAsync(0);
      expect(calls).toBe(1);

      // Backoff waits: 1000ms then 2000ms.
      await vi.advanceTimersByTimeAsync(1000);
      expect(calls).toBe(2);
      await vi.advanceTimersByTimeAsync(2000);
      expect(calls).toBe(3);

      await rejection;
      expect(calls).toBe(3);
    });

    it('does not retry a non-429 failure', async () => {
      let calls = 0;
      const config: RateLimitConfig = { ...DEFAULT_RATE_LIMIT_CONFIG, random: () => 0.5 };
      const source = new Observable<number>((subscriber) => {
        calls += 1;
        subscriber.error(new HttpErrorResponse({ status: 500 }));
      });

      await expect(firstValueFrom(source.pipe(rateLimit(config)))).rejects.toMatchObject({
        status: 500,
      });
      expect(calls).toBe(1);
    });

    it('does not retry a 404 response', async () => {
      let calls = 0;
      const config: RateLimitConfig = { ...DEFAULT_RATE_LIMIT_CONFIG, random: () => 0.5 };
      const source = new Observable<number>((subscriber) => {
        calls += 1;
        subscriber.error(new HttpErrorResponse({ status: 404 }));
      });

      await expect(firstValueFrom(source.pipe(rateLimit(config)))).rejects.toMatchObject({
        status: 404,
      });
      expect(calls).toBe(1);
    });

    it('retries a network-level failure (status 0) and succeeds after backoff', async () => {
      vi.useFakeTimers();

      let calls = 0;
      const config: RateLimitConfig = { ...DEFAULT_RATE_LIMIT_CONFIG, random: () => 0.5 };
      const source = new Observable<number>((subscriber) => {
        calls += 1;
        if (calls < 3) {
          subscriber.error(new HttpErrorResponse({ status: 0 }));
          return;
        }
        subscriber.next(42);
        subscriber.complete();
      });

      const resultPromise = firstValueFrom(source.pipe(rateLimit(config)));

      await vi.advanceTimersByTimeAsync(0);
      expect(calls).toBe(1);

      // First retry waits `clamp(1s) * 2^0 * 1.0` = 1000ms.
      await vi.advanceTimersByTimeAsync(1000);
      expect(calls).toBe(2);

      // Second retry waits `clamp(1s) * 2^1 * 1.0` = 2000ms.
      await vi.advanceTimersByTimeAsync(2000);
      expect(calls).toBe(3);

      await expect(resultPromise).resolves.toBe(42);
    });

    it('does not retry a non-http application error', async () => {
      let calls = 0;
      const config: RateLimitConfig = { ...DEFAULT_RATE_LIMIT_CONFIG, random: () => 0.5 };
      const source = new Observable<number>((subscriber) => {
        calls += 1;
        subscriber.error(new Error('validation failed'));
      });

      await expect(firstValueFrom(source.pipe(rateLimit(config)))).rejects.toThrow(
        'validation failed',
      );
      expect(calls).toBe(1);
    });

    it('releases the in-flight permit when a request is dropped', async () => {
      vi.useFakeTimers();

      const config: RateLimitConfig = {
        ...DEFAULT_RATE_LIMIT_CONFIG,
        concurrency: 1,
        random: () => 0.5,
      };

      const failing = new Observable<number>((subscriber) => {
        subscriber.error(retryAfter429('1'));
      });
      const failingPromise = firstValueFrom(failing.pipe(rateLimit(config)));
      const failingExpectation = expect(failingPromise).rejects.toMatchObject({ status: 429 });
      await vi.advanceTimersByTimeAsync(3000);
      await failingExpectation;

      // The dropped request must free its permit, otherwise the next request with
      // concurrency 1 would never start.
      let calls = 0;
      const succeeding = new Observable<number>((subscriber) => {
        calls += 1;
        subscriber.next(1);
        subscriber.complete();
      });
      const resultPromise = firstValueFrom(succeeding.pipe(rateLimit(config)));
      await vi.advanceTimersByTimeAsync(0);

      await expect(resultPromise).resolves.toBe(1);
      expect(calls).toBe(1);
    });
  });
});

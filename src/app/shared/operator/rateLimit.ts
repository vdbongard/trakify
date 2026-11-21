import { HttpErrorResponse } from '@angular/common/http';
import {
  finalize,
  MonoTypeOperatorFunction,
  Observable,
  ObservableInput,
  retry,
  Subscription,
  throwError,
  timer,
} from 'rxjs';

export interface RateLimitConfig {
  concurrency: number;
  attempts: number;
  retryAfterFloorMs: number;
  retryAfterCapMs: number;
  backoffMultiplier: number;
  random: () => number;
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  concurrency: 8,
  attempts: 3,
  retryAfterFloorMs: 1000,
  retryAfterCapMs: 60_000,
  backoffMultiplier: 2,
  random: Math.random,
};

const limiters = new Map<RateLimitConfig, ConcurrencyLimiter>();

class ConcurrencyLimiter {
  private active = 0;
  private readonly queue: (() => void)[] = [];

  constructor(private readonly max: number) {}

  acquire(): Promise<void> {
    if (this.active < this.max) {
      this.active += 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active += 1;
        resolve();
      });
    });
  }

  release(): void {
    this.active -= 1;
    const next = this.queue.shift();
    if (next) next();
  }
}

function limiterFor(config: RateLimitConfig): ConcurrencyLimiter {
  let limiter = limiters.get(config);
  if (!limiter) {
    limiter = new ConcurrencyLimiter(config.concurrency);
    limiters.set(config, limiter);
  }
  return limiter;
}

export function resetRateLimit(): void {
  limiters.clear();
}

function isTransientFailure(error: unknown): error is HttpErrorResponse {
  return error instanceof HttpErrorResponse && (error.status === 429 || error.status === 0);
}

function retryDelay(error: unknown, attempt: number, config: RateLimitConfig): ObservableInput<0> {
  if (!isTransientFailure(error)) {
    return throwError(() => error);
  }
  const retryAfterMs = clampedRetryAfterMs(error, config);
  const backoff = retryAfterMs * Math.pow(config.backoffMultiplier, attempt - 1);
  const jitter = 0.5 + config.random();
  return timer(Math.round(backoff * jitter));
}

function clampedRetryAfterMs(error: HttpErrorResponse, config: RateLimitConfig): number {
  const header = error.headers.get('Retry-After');
  const seconds = header ? parseInt(header, 10) : NaN;
  const retryAfterMs = Number.isNaN(seconds) ? config.retryAfterFloorMs : seconds * 1000;
  return Math.min(Math.max(retryAfterMs, config.retryAfterFloorMs), config.retryAfterCapMs);
}

export function rateLimit<T>(
  config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG,
): MonoTypeOperatorFunction<T> {
  const limiter = limiterFor(config);

  return (source: Observable<T>): Observable<T> =>
    new Observable<T>((subscriber) => {
      let inner: Subscription | undefined;
      let cancelled = false;

      void limiter.acquire().then(() => {
        if (cancelled) {
          limiter.release();
          return;
        }
        inner = source
          .pipe(
            retry({
              count: config.attempts - 1,
              delay: (error: unknown, attempt: number): ObservableInput<0> =>
                retryDelay(error, attempt, config),
            }),
            finalize(() => limiter.release()),
          )
          .subscribe(subscriber);
      });

      return (): void => {
        cancelled = true;
        inner?.unsubscribe();
      };
    });
}

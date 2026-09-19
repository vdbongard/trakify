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
  /** Maximum number of requests allowed in flight at the same time. */
  concurrency: number;
  /** Maximum total attempts for a 429 response; the first attempt counts as attempt 1. */
  attempts: number;
  /** Lower bound in milliseconds for a delay derived from the Retry-After header. */
  retryAfterFloorMs: number;
  /** Upper bound in milliseconds for a delay derived from the Retry-After header. */
  retryAfterCapMs: number;
  /** Exponential backoff multiplier applied to each additional attempt. */
  backoffMultiplier: number;
  /** Random source used for jitter. Defaults to Math.random; inject a fixed value in tests. */
  random: () => number;
}

/**
 * Rate-limit safety net applied at the fetch layer so every sync request shares one
 * in-flight budget: at most `concurrency` requests run at once, and 429 responses are
 * retried honoring the Retry-After header (floored and capped), with exponential backoff
 * plus jitter, up to `attempts` total attempts before the failure is surfaced.
 * Non-429 failures are never retried.
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  concurrency: 8,
  attempts: 3,
  retryAfterFloorMs: 1000,
  retryAfterCapMs: 60_000,
  backoffMultiplier: 2,
  random: Math.random,
};

/** Permit pool shared by every request using the same config object. */
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

/**
 * Clears all shared permit pools so each test starts with a fresh in-flight budget.
 * Not used by application code.
 */
export function resetRateLimit(): void {
  limiters.clear();
}

/** Delay notifier used by `retry`: retries only 429 responses with backed-off Retry-After. */
function retryDelay(error: unknown, attempt: number, config: RateLimitConfig): ObservableInput<0> {
  if (!(error instanceof HttpErrorResponse) || error.status !== 429) {
    // Non-429 failures are not retried; surfacing the notifier error forwards the original error.
    return throwError(() => error);
  }
  const retryAfterMs = clampedRetryAfterMs(error, config);
  const backoff = retryAfterMs * Math.pow(config.backoffMultiplier, attempt - 1);
  const jitter = 0.5 + config.random();
  return timer(Math.round(backoff * jitter));
}

/** Retry-After header converted to a delay, clamped to the configured floor and cap. */
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

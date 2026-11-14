import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY, Observable } from 'rxjs';
import { LoadingState } from '@type/Loading';
import { HttpErrorResponse } from '@angular/common/http';
import { WritableSignal } from '@angular/core';

/**
 * Whether the value carries a message worth showing to the reader. Angular's `HttpErrorResponse`
 * implements `Error` without extending it, so it has to be named here too.
 */
export function isErrorLike(error: unknown): boolean {
  return error instanceof HttpErrorResponse || error instanceof Error;
}

/**
 * A sentence the reader can act on for an HTTP failure.
 *
 * `HttpErrorResponse.message` names the URL and the transport ("Http failure response for
 * https://api.trakt.tv/shows/x: 0 undefined"), which reads as a crash to anyone outside the
 * console and says nothing they can do about it.
 */
export function getHttpErrorMessage(error: HttpErrorResponse): string {
  switch (error.status) {
    case 0:
      return 'Could not reach the server. Check your connection and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to do that.';
    case 404:
      return 'The requested item could not be found.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
  }
  if (error.status >= 500) return 'The server is having problems. Please try again in a moment.';
  return `The request failed (${error.status}). Please try again.`;
}

export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (error instanceof HttpErrorResponse) return getHttpErrorMessage(error);
  if (error instanceof Error) return error.message;
  return fallback;
}

export function onError(
  error?: unknown,
  snackBar?: MatSnackBar,
  loadingStates?: WritableSignal<LoadingState>[],
  errorMessage?: string,
  name?: string,
): void {
  console.error(name, error ?? errorMessage);
  loadingStates?.forEach((loadingState) => loadingState.set('error'));

  const message = getErrorMessage(
    error,
    errorMessage ?? `Unknown error (${JSON.stringify(error)})`,
  );

  snackBar
    ?.open(message, 'Reload', { duration: 6000 })
    .onAction()
    .subscribe(() => window.location.reload());
}

export function onError$(
  error?: unknown,
  snackBar?: MatSnackBar,
  loadingStates?: WritableSignal<LoadingState>[],
  errorMessage?: string,
  name?: string,
): Observable<never> {
  onError(error, snackBar, loadingStates, errorMessage, name);
  return EMPTY;
}

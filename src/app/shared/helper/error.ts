import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';

import { LoadingState } from '@type/Enum';
import { HttpErrorResponse } from '@angular/common/http';

export function onError(
  error?: unknown,
  snackBar?: MatSnackBar,
  loadingStates?: BehaviorSubject<LoadingState>[],
  errorMessage?: string,
  name?: string,
): void {
  console.error(name, error ?? errorMessage);
  loadingStates?.forEach((loadingState) => loadingState.next(LoadingState.ERROR));

  let message = errorMessage;
  if (!message && error instanceof Error) message = error.message;
  if (!message && error instanceof HttpErrorResponse) message = error.message;
  if (!message) message = message = `Unknown error (${JSON.stringify(error)})`;

  snackBar
    ?.open(message, 'Reload', { duration: 6000 })
    .onAction()
    .subscribe(() => document.location.reload());
}

export function onError$(
  error?: unknown,
  snackBar?: MatSnackBar,
  loadingStates?: BehaviorSubject<LoadingState>[],
  errorMessage?: string,
  name?: string,
): Observable<never> {
  onError(error, snackBar, loadingStates, errorMessage, name);
  return EMPTY;
}

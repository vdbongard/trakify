import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';

import { LoadingState } from '@type/enum';

export function onError(
  error?: unknown,
  snackBar?: MatSnackBar,
  loadingState?: BehaviorSubject<LoadingState>,
  errorMessage?: string
): void {
  console.error(error ?? errorMessage);
  loadingState?.next(LoadingState.ERROR);

  let message = errorMessage;
  if (!message && error instanceof Error) message = error.message;
  if (!message) message = (error as Object).toString();

  snackBar
    ?.open(message, 'Reload', { duration: 6000 })
    .onAction()
    .subscribe(() => document.location.reload());
}

export function onError$(
  error?: Error | unknown,
  snackBar?: MatSnackBar,
  loadingState?: BehaviorSubject<LoadingState>,
  errorMessage?: string
): Observable<never> {
  onError(error, snackBar, loadingState, errorMessage);
  return EMPTY;
}

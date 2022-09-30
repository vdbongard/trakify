import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';

import { LoadingState } from '@type/enum';

export function onError(
  error?: Error | unknown,
  snackBar?: MatSnackBar,
  loadingState?: BehaviorSubject<LoadingState>,
  errorMessage?: string
): void {
  console.error(error ?? errorMessage);
  loadingState?.next(LoadingState.ERROR);
  snackBar
    ?.open(errorMessage ?? (error as Object).toString(), 'Reload', { duration: 6000 })
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

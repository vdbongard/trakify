import { LoadingState } from '../../types/enum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';

export function onError(
  error: Error,
  snackBar?: MatSnackBar,
  loadingState?: BehaviorSubject<LoadingState>,
  errorMessage?: string
): void {
  console.error(error);
  loadingState?.next(LoadingState.ERROR);
  snackBar
    ?.open(errorMessage ?? error.toString(), 'Reload', { duration: 6000 })
    .onAction()
    .subscribe(() => document.location.reload());
}

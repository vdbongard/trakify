import { LoadingState } from '../../types/enum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';

export function onError(
  error: unknown,
  snackBar?: MatSnackBar,
  loadingState?: BehaviorSubject<LoadingState>
): void {
  console.error(error);
  loadingState?.next(LoadingState.ERROR);
  snackBar
    ?.open(error as string, 'Reload', { duration: 6000 })
    .onAction()
    .subscribe(() => document.location.reload());
}

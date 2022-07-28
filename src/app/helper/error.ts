import { LoadingState } from '../../types/enum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';

export function onError(
  error: unknown,
  loadingState: BehaviorSubject<LoadingState>,
  snackBar: MatSnackBar
): void {
  loadingState.next(LoadingState.ERROR);
  console.error(error);
  snackBar
    .open(error as string, 'Reload', { duration: 6000 })
    .onAction()
    .subscribe(() => document.location.reload());
}

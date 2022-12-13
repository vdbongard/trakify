import {
  BehaviorSubject,
  catchError,
  MonoTypeOperatorFunction,
  Observable,
  shareReplay,
  tap,
} from 'rxjs';
import { onError$ } from '@helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingState } from '@type/enum';

export function catchErrorAndReplay<T>(
  name: string,
  snackBar: MatSnackBar,
  pageState: BehaviorSubject<LoadingState>,
  errorMessage?: string
): MonoTypeOperatorFunction<T> {
  return function <T>(source: Observable<T>) {
    return source.pipe(
      catchError((error) => onError$(error, snackBar, pageState, errorMessage, name)),
      tap((value) => value !== undefined && console.debug(name, value)),
      shareReplay()
    );
  };
}

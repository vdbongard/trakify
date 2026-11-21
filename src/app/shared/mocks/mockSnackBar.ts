import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY } from 'rxjs';
import type { Observable } from 'rxjs';

export const mockSnackBarProvider = {
  provide: MatSnackBar,
  useValue: {
    open: (): { onAction: () => Observable<never>; dismiss: () => void } => ({
      onAction: (): Observable<never> => EMPTY,
      dismiss: (): void => undefined,
    }),
  },
};

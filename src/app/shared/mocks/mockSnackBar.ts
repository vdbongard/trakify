import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY } from 'rxjs';
import type { Observable } from 'rxjs';

/**
 * A `MatSnackBar` that opens nothing, for specs whose subject only needs the service to exist.
 * Specs that assert on a notice provide their own `open` spy instead.
 */
export const mockSnackBarProvider = {
  provide: MatSnackBar,
  useValue: {
    open: (): { onAction: () => Observable<never>; dismiss: () => void } => ({
      onAction: (): Observable<never> => EMPTY,
      dismiss: (): void => undefined,
    }),
  },
};

import { SwUpdate } from '@angular/service-worker';
import { EMPTY, Observable, of } from 'rxjs';

export const mockSwUpdateProvider = {
  provide: SwUpdate,
  useValue: {
    isEnabled: false,
    versionUpdates: EMPTY,
    unrecoverable: EMPTY,
    checkForUpdate: (): Observable<boolean> => of(false),
  },
};

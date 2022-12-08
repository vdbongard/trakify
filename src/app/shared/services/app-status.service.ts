import { ApplicationRef, Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { concat, first, fromEvent, interval, map, merge, Observable, of, skip } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppStatusService {
  constructor(
    private updates: SwUpdate,
    private appRef: ApplicationRef,
    private snackBar: MatSnackBar
  ) {
    if (!updates.isEnabled) return;

    updates.versionUpdates.subscribe((event) => {
      switch (event.type) {
        case 'VERSION_DETECTED':
          this.snackBar.open(`Downloading new version...`, undefined, {
            duration: 2000,
          });
          break;
        case 'VERSION_READY':
          const snackBarRef = this.snackBar.open('New version available', 'Update', {
            duration: 6000,
          });
          snackBarRef.onAction().subscribe(async () => {
            await this.updates.activateUpdate();
            document.location.reload();
          });
          break;
        case 'VERSION_INSTALLATION_FAILED':
          this.snackBar.open(`Failed to install app version`, undefined, {
            duration: 2000,
          });
          break;
        case 'NO_NEW_VERSION_DETECTED':
          console.log(`No new version available. Current version: ${event.version.hash}`);
          break;
      }
    });

    // Allow the app to stabilize first, before starting
    // polling for updates with `interval()`.
    const appIsStable$ = appRef.isStable.pipe(first((isStable) => isStable));
    const everySixHours$ = interval(6 * 60 * 60 * 1000);
    const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

    everySixHoursOnceAppIsStable$.subscribe(() => updates.checkForUpdate());

    updates.unrecoverable.subscribe(() => {
      const snackBarRef = this.snackBar.open('An error occurred', 'Reload');
      snackBarRef.onAction().subscribe(async () => {
        document.location.reload();
      });
    });

    this.isOnline$()
      .pipe(skip(1))
      .subscribe((isOnline) => {
        !isOnline &&
          this.snackBar.open(`App is offline`, undefined, {
            duration: 2000,
          });
      });
  }

  isOnline$(): Observable<boolean> {
    return merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    );
  }

  async checkForUpdate(): Promise<void> {
    if (!(await this.updates.checkForUpdate())) {
      this.snackBar.open(`No new version available`, undefined, {
        duration: 2000,
      });
    }
  }
}

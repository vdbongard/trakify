import { ApplicationRef, Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { concat, first, fromEvent, interval, map, merge, Observable, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

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
          console.log(`Downloading new app version: ${event.version.hash}`);
          this.snackBar.open(`Downloading new version...`, undefined, {
            duration: 2000,
          });
          break;
        case 'VERSION_READY':
          console.log(`Current app version: ${event.currentVersion.hash}`);
          console.log(`New app version ready for use: ${event.latestVersion.hash}`);
          const snackBarRef = this.snackBar.open('New app version', 'Update');
          snackBarRef.onAction().subscribe(async () => {
            await this.updates.activateUpdate();
            document.location.reload();
          });
          break;
        case 'VERSION_INSTALLATION_FAILED':
          console.log(`Failed to install app version '${event.version.hash}': ${event.error}`);
          this.snackBar.open(`Failed to install app version`, undefined, {
            duration: 2000,
          });
          break;
        case 'NO_NEW_VERSION_DETECTED':
          console.log(`No new app version detected. Current version: ${event.version.hash}`);
          break;
      }
    });

    // Allow the app to stabilize first, before starting
    // polling for updates with `interval()`.
    const appIsStable$ = appRef.isStable.pipe(first((isStable) => isStable));
    const everySixHours$ = interval(6 * 60 * 60 * 1000);
    const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

    everySixHoursOnceAppIsStable$.subscribe(() => updates.checkForUpdate());

    updates.unrecoverable.subscribe((event) => {
      console.log(
        'An error occurred that we cannot recover from:\n' +
          event.reason +
          '\n\nPlease reload the page.'
      );
      const snackBarRef = this.snackBar.open('An error occurred', 'Reload');
      snackBarRef.onAction().subscribe(async () => {
        document.location.reload();
      });
    });
  }

  isOnline(): Observable<boolean> {
    return merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    );
  }

  async checkForUpdate(): Promise<void> {
    console.log('Check for updates');
    const isUpdateAvailable = await this.updates.checkForUpdate();
    if (isUpdateAvailable) {
      console.log(`New version detected`);
      const snackBarRef = this.snackBar.open('New version', 'Update');
      snackBarRef.onAction().subscribe(async () => {
        await this.updates.activateUpdate();
        document.location.reload();
      });
    } else {
      console.log(`No new version detected`);
      this.snackBar.open(`No new version`, undefined, {
        duration: 2000,
      });
    }
  }
}

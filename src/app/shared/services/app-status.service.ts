import { ApplicationRef, inject, Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { concat, first, interval } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppStatusService {
  private updates = inject(SwUpdate);
  private appRef = inject(ApplicationRef);
  private snackBar = inject(MatSnackBar);

  constructor() {
    if (!this.updates.isEnabled) return;
    this.handleVersionUpdates();
    this.handleError();
    this.initCheckForUpdates();
  }

  private handleVersionUpdates(): void {
    this.updates.versionUpdates.subscribe((event) => {
      switch (event.type) {
        case 'VERSION_DETECTED':
          this.snackBar.open('Downloading new version...', undefined, {
            duration: 2000,
          });
          break;
        case 'VERSION_READY':
          this.snackBar
            .open('New version available', 'Update', { duration: 6000 })
            .onAction()
            .subscribe(() => {
              void this.updates.activateUpdate();
              document.location.reload();
            });
          break;
        case 'VERSION_INSTALLATION_FAILED':
          this.snackBar.open('Failed to install app version', undefined, {
            duration: 2000,
          });
          break;
        case 'NO_NEW_VERSION_DETECTED':
          console.log(`No new version available. Current version: ${event.version.hash}`);
          break;
      }
    });
  }

  private handleError(): void {
    this.updates.unrecoverable.subscribe(() => {
      const snackBarRef = this.snackBar.open('An error occurred', 'Reload');
      snackBarRef.onAction().subscribe(() => {
        document.location.reload();
      });
    });
  }

  private initCheckForUpdates(): void {
    // Allow the app to stabilize first, before starting
    // polling for updates with `interval()`.
    const appIsStable$ = this.appRef.isStable.pipe(first((isStable) => isStable));
    const everySixHours$ = interval(6 * 60 * 60 * 1000);
    const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);
    everySixHoursOnceAppIsStable$.subscribe(() => void this.updates.checkForUpdate());
  }

  async checkForUpdate(): Promise<void> {
    if (!(await this.updates.checkForUpdate())) {
      this.snackBar.open('No new version available', undefined, {
        duration: 2000,
      });
    }
  }
}

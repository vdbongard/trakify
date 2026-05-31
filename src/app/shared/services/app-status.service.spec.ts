import { TestBed } from '@angular/core/testing';
import { AppStatusService } from './app-status.service';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('AppStatusService', () => {
  let service: AppStatusService;
  let mockSwUpdate: {
    isEnabled: boolean;
    versionUpdates: Subject<{ type: string; version?: { hash: string } }>;
    unrecoverable: Subject<unknown>;
    checkForUpdate: ReturnType<typeof vi.fn>;
    activateUpdate: ReturnType<typeof vi.fn>;
  };
  let versionUpdates$: Subject<{ type: string; version?: { hash: string } }>;
  let unrecoverable$: Subject<unknown>;

  function createService(): AppStatusService {
    TestBed.configureTestingModule({});
    TestBed.overrideProvider(SwUpdate, { useValue: mockSwUpdate });
    return TestBed.inject(AppStatusService);
  }

  describe('when SwUpdate is disabled', () => {
    beforeEach(() => {
      versionUpdates$ = new Subject();
      unrecoverable$ = new Subject();
      mockSwUpdate = {
        isEnabled: false,
        versionUpdates: versionUpdates$,
        unrecoverable: unrecoverable$,
        checkForUpdate: vi.fn(),
        activateUpdate: vi.fn(),
      };
      service = createService();
    });

    it('should not call checkForUpdate', () => {
      expect(mockSwUpdate.checkForUpdate).not.toHaveBeenCalled();
    });
  });

  describe('when SwUpdate is enabled', () => {
    beforeEach(() => {
      versionUpdates$ = new Subject();
      unrecoverable$ = new Subject();
      mockSwUpdate = {
        isEnabled: true,
        versionUpdates: versionUpdates$,
        unrecoverable: unrecoverable$,
        checkForUpdate: vi.fn().mockResolvedValue(false),
        activateUpdate: vi.fn().mockResolvedValue(undefined),
      };
      service = createService();
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    describe('checkForUpdate', () => {
      it('should show snackbar when no update available', async () => {
        const snackBar = TestBed.inject(MatSnackBar);
        const openSpy = vi.spyOn(snackBar, 'open');
        await service.checkForUpdate();
        expect(openSpy).toHaveBeenCalledWith('No new version available', undefined, {
          duration: 2000,
        });
      });

      it('should not show snackbar when update is available', async () => {
        mockSwUpdate.checkForUpdate = vi.fn().mockResolvedValue(true);
        const snackBar = TestBed.inject(MatSnackBar);
        const openSpy = vi.spyOn(snackBar, 'open');
        await service.checkForUpdate();
        expect(openSpy).not.toHaveBeenCalled();
      });
    });

    describe('version updates', () => {
      it('should show snackbar on VERSION_READY', () => {
        const snackBar = TestBed.inject(MatSnackBar);
        const openSpy = vi.spyOn(snackBar, 'open');
        versionUpdates$.next({ type: 'VERSION_READY' });
        expect(openSpy).toHaveBeenCalledWith('New version available', 'Update', { duration: 6000 });
      });

      it('should show snackbar on VERSION_INSTALLATION_FAILED', () => {
        const snackBar = TestBed.inject(MatSnackBar);
        const openSpy = vi.spyOn(snackBar, 'open');
        versionUpdates$.next({ type: 'VERSION_INSTALLATION_FAILED' });
        expect(openSpy).toHaveBeenCalledWith('Failed to install app version', undefined, {
          duration: 2000,
        });
      });

      it('should not show snackbar on NO_NEW_VERSION_DETECTED', () => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        const snackBar = TestBed.inject(MatSnackBar);
        const openSpy = vi.spyOn(snackBar, 'open');
        versionUpdates$.next({ type: 'NO_NEW_VERSION_DETECTED', version: { hash: 'abc123' } });
        expect(openSpy).not.toHaveBeenCalled();
      });
    });

    describe('unrecoverable error', () => {
      it('should show snackbar with reload action', () => {
        const snackBar = TestBed.inject(MatSnackBar);
        const openSpy = vi.spyOn(snackBar, 'open');
        unrecoverable$.next({});
        expect(openSpy).toHaveBeenCalledWith('An error occurred', 'Reload');
      });
    });
  });
});

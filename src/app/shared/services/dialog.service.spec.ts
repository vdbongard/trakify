import { TestBed } from '@angular/core/testing';
import { DialogService } from './dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { provideOAuthClient } from 'angular-oauth2-oidc';

describe('DialogService', () => {
  let service: DialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MatDialog, useValue: { open: vi.fn() } }, provideOAuthClient()],
    });
    service = TestBed.inject(DialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('confirm', () => {
    it('should return true when dialog confirms', async () => {
      const dialog = TestBed.inject(MatDialog);
      vi.mocked(dialog.open).mockReturnValue({
        afterClosed: () => of(true),
      } as never);
      const result = await service.confirm({
        title: 'Test',
        message: 'Test?',
        confirmButton: 'OK',
      });
      expect(result).toBe(true);
    });

    it('should return false when dialog is cancelled', async () => {
      const dialog = TestBed.inject(MatDialog);
      vi.mocked(dialog.open).mockReturnValue({
        afterClosed: () => of(false),
      } as never);
      const result = await service.confirm({
        title: 'Test',
        message: 'Test?',
        confirmButton: 'OK',
      });
      expect(result).toBe(false);
    });
  });
});

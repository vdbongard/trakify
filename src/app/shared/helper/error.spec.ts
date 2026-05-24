import { onError, onError$ } from './error';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { LoadingState } from '@type/Loading';
import { HttpErrorResponse } from '@angular/common/http';
import { NEVER } from 'rxjs';

describe('error helper', () => {
  let mockSnackBar: Pick<MatSnackBar, 'open'>;

  beforeEach(() => {
    mockSnackBar = {
      open: vi.fn().mockReturnValue({
        onAction: vi.fn().mockReturnValue(NEVER),
      }),
    };
  });

  it('should log to console, set signals to error state, and open snackbar', () => {
    const errorSignal = signal<LoadingState>('loading');
    const signals = [errorSignal];
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    onError(
      new Error('Test error message'),
      mockSnackBar as unknown as MatSnackBar,
      signals,
      undefined,
      'TestName',
    );

    expect(consoleSpy).toHaveBeenCalledWith('TestName', expect.any(Error));
    expect(errorSignal()).toBe('error');
    expect(mockSnackBar.open).toHaveBeenCalledWith('Test error message', 'Reload', {
      duration: 6000,
    });

    consoleSpy.mockRestore();
  });

  it('should fallback to HttpErrorResponse message or Unknown error string', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const httpError = new HttpErrorResponse({
      error: 'http error',
      status: 500,
      statusText: 'Server Error',
      url: 'http://foo',
    });

    onError(httpError, mockSnackBar as unknown as MatSnackBar);
    expect(mockSnackBar.open).toHaveBeenCalledWith(httpError.message, 'Reload', { duration: 6000 });

    onError('string error', mockSnackBar as unknown as MatSnackBar);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Unknown error ("string error")', 'Reload', {
      duration: 6000,
    });

    consoleSpy.mockRestore();
  });

  it('should return EMPTY from onError$', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result$ = onError$(new Error('Test error'), mockSnackBar as unknown as MatSnackBar);
    let completed = false;

    result$.subscribe({
      complete: () => {
        completed = true;
      },
    });

    expect(completed).toBe(true);
    consoleSpy.mockRestore();
  });
});

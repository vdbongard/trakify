import { of, throwError } from 'rxjs';
import { catchErrorAndReplay } from './catchErrorAndReplay';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import type { LoadingState } from '@type/Loading';

describe('catchErrorAndReplay', () => {
  let snackBar: MatSnackBar;
  let pageStates: ReturnType<typeof signal<LoadingState>>[];

  beforeEach(() => {
    snackBar = {
      open: vi.fn().mockReturnValue({ onAction: () => ({ subscribe: vi.fn() }) }),
    } as unknown as MatSnackBar;
    pageStates = [signal<LoadingState>('loading')];
  });

  it('should pass through values on success', () => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    const source$ = of('test');
    const values: string[] = [];

    source$.pipe(catchErrorAndReplay('test', snackBar, pageStates)).subscribe({
      next: (v) => values.push(v),
    });

    expect(values).toEqual(['test']);
  });

  it('should catch errors and not propagate them', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('test error');
    const source$ = throwError(() => error);
    const values: string[] = [];
    let errorCalled = false;

    source$.pipe(catchErrorAndReplay('test', snackBar, pageStates)).subscribe({
      next: (v) => values.push(v),
      error: () => {
        errorCalled = true;
      },
    });

    expect(values).toEqual([]);
    expect(errorCalled).toBe(false);
  });
});

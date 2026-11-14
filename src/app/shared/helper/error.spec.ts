import { getErrorMessage, onError, onError$ } from './error';
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

  it('should turn an HttpErrorResponse into a message a reader can act on', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const httpError = new HttpErrorResponse({
      error: 'http error',
      status: 500,
      statusText: 'Server Error',
      url: 'http://foo',
    });

    onError(httpError, mockSnackBar as unknown as MatSnackBar);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'The server is having problems. Please try again in a moment.',
      'Reload',
      { duration: 6000 },
    );

    onError('string error', mockSnackBar as unknown as MatSnackBar);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Unknown error ("string error")', 'Reload', {
      duration: 6000,
    });

    consoleSpy.mockRestore();
  });

  it('should map each HTTP failure status to an actionable message', () => {
    expect(getErrorMessage(new HttpErrorResponse({ status: 0 }))).toBe(
      'Could not reach the server. Check your connection and try again.',
    );
    expect(getErrorMessage(new HttpErrorResponse({ status: 401 }))).toBe(
      'Your session has expired. Please log in again.',
    );
    expect(getErrorMessage(new HttpErrorResponse({ status: 403 }))).toBe(
      'You do not have permission to do that.',
    );
    expect(getErrorMessage(new HttpErrorResponse({ status: 404 }))).toBe(
      'The requested item could not be found.',
    );
    expect(getErrorMessage(new HttpErrorResponse({ status: 429 }))).toBe(
      'Too many requests. Please wait a moment and try again.',
    );
    expect(getErrorMessage(new HttpErrorResponse({ status: 400 }))).toBe(
      'The request failed (400). Please try again.',
    );
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

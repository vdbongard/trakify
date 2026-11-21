import { DestroyRef, inject, Injectable, OnDestroy } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getErrorMessage } from '@helper/error';

const DEDUPE_WINDOW_MS = 5000;

const NOTICE_DURATION_MS = 8000;

@Injectable()
export class QueryErrorNoticeService implements OnDestroy {
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private openRef?: MatSnackBarRef<TextOnlySnackBar>;
  private lastMessage?: string;
  private lastShownAt = 0;

  show(error: unknown, retry: () => void): void {
    const message = getErrorMessage(error);
    const now = Date.now();
    if (message === this.lastMessage && now - this.lastShownAt < DEDUPE_WINDOW_MS) return;

    this.lastMessage = message;
    this.lastShownAt = now;
    this.openRef?.dismiss();

    const ref = this.snackBar.open(message, 'Retry', { duration: NOTICE_DURATION_MS });
    this.openRef = ref;
    ref
      .onAction()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.lastMessage = undefined;
        this.openRef = undefined;
        retry();
      });
  }

  ngOnDestroy(): void {
    this.openRef?.dismiss();
  }
}

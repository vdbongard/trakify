import { DestroyRef, inject, Injectable, OnDestroy } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getErrorMessage } from '@helper/error';

/** How long an identical message is suppressed after it was shown, so several queries failing for
 *  the same reason report once instead of queueing one Snackbar each. */
const DEDUPE_WINDOW_MS = 5000;

const NOTICE_DURATION_MS = 8000;

/**
 * Reports a failed query request without moving the page it is about.
 *
 * A Query only reports failure once its own retries are exhausted, which lands seconds after the
 * page rendered — exactly when the reader is looking at the description, the cast or a season list.
 * A block inserted above that content pushes it down (a layout shift for information the reader
 * did not ask for); the Snackbar overlays the page instead, and `Retry` refetches the query rather
 * than reloading the whole app.
 *
 * Provided by each page, so the de-duplication window belongs to that page: the same message failing
 * on the next page is still reported there. Mutations keep using `onError`, whose action reloads.
 */
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

  /** The notice belongs to the page that opened it; leaving the page takes it along. */
  ngOnDestroy(): void {
    this.openRef?.dismiss();
  }
}

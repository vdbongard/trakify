import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { QueryErrorNoticeService } from './query-error-notice.service';

describe('QueryErrorNoticeService', () => {
  let service: QueryErrorNoticeService;
  let action$: Subject<void>;
  let open: ReturnType<typeof vi.fn>;
  let dismiss: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    action$ = new Subject<void>();
    dismiss = vi.fn();
    open = vi.fn((): { onAction: () => Subject<void>; dismiss: ReturnType<typeof vi.fn> } => ({
      onAction: () => action$,
      dismiss,
    }));
    TestBed.configureTestingModule({
      providers: [QueryErrorNoticeService, { provide: MatSnackBar, useValue: { open } }],
    });
    service = TestBed.inject(QueryErrorNoticeService);
  });

  it('shows an actionable message for the failure', () => {
    service.show(new HttpErrorResponse({ status: 0 }), vi.fn());

    expect(open).toHaveBeenCalledWith(
      'Could not reach the server. Check your connection and try again.',
      'Retry',
      { duration: 8000 },
    );
  });

  it('refetches through the action instead of reloading the page', () => {
    const retry = vi.fn();

    service.show(new Error('boom'), retry);
    action$.next();

    expect(retry).toHaveBeenCalled();
  });

  it('reports several queries failing for the same reason once', () => {
    service.show(new HttpErrorResponse({ status: 429 }), vi.fn());
    service.show(new HttpErrorResponse({ status: 429 }), vi.fn());

    expect(open).toHaveBeenCalledTimes(1);
  });

  it('replaces the open notice when a different failure arrives', () => {
    service.show(new HttpErrorResponse({ status: 429 }), vi.fn());
    service.show(new HttpErrorResponse({ status: 0 }), vi.fn());

    expect(dismiss).toHaveBeenCalled();
    expect(open).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenLastCalledWith(
      'Could not reach the server. Check your connection and try again.',
      'Retry',
      { duration: 8000 },
    );
  });

  it('takes its notice along when the page goes away', () => {
    service.show(new Error('boom'), vi.fn());

    service.ngOnDestroy();

    expect(dismiss).toHaveBeenCalled();
  });
});

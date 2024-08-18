import { DestroyRef } from '@angular/core';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// based on https://github.com/dimsemenov/PhotoSwipe/issues/1890#issuecomment-1302460136
export function initBackButtonToClosePhotoSwipe(destroyRef: DestroyRef): void {
  if (!history.state || !history.state.pswp || history.state.path !== window.location.pathname) {
    history.pushState({ pswp: true, path: window.location.pathname }, '', window.location.pathname);
  }
  fromEvent(window, 'popstate')
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe(() => {
      if (typeof window.pswp === 'object' && window.pswp && window.pswp.isOpen) {
        history.pushState(
          { pswp: true, path: window.location.pathname },
          '',
          window.location.pathname,
        );
        window.pswp.close();
      } else {
        history.go(-1);
      }
    });
}

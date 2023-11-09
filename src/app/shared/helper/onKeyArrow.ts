import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export function onKeyArrow({ arrowRight, arrowLeft }: ArrowEvents): void {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

  fromEvent(window, 'keyup')
    .pipe(takeUntilDestroyed())
    .subscribe((event: Event) => {
      if (!(event instanceof KeyboardEvent)) return;
      if (event.key === 'ArrowRight') {
        arrowRight();
      } else if (event.key === 'ArrowLeft') {
        arrowLeft();
      }
    });
}

interface ArrowEvents {
  arrowRight: () => void;
  arrowLeft: () => void;
}

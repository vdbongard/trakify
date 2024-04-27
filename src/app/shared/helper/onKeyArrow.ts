import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

export function onKeyArrow({ arrowRight, arrowLeft }: ArrowEvents): void {
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

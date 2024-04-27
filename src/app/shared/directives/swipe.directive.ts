import { DOCUMENT } from '@angular/common';
import {
  Directive,
  NgZone,
  type OnDestroy,
  type OnInit,
  inject,
  input,
  output,
} from '@angular/core';

@Directive({
  selector: '[tSwipe]',
  standalone: true,
})
export class SwipeDirective implements OnInit, OnDestroy {
  ngZone = inject(NgZone);
  document = inject(DOCUMENT);

  swipeThresholdPx = input(40);
  swipeTimeoutMs = input(200);

  swipeLeft = output<Event>();
  swipeRight = output<Event>();
  swipeUp = output<Event>();
  swipeDown = output<Event>();

  xDown: number | null = null;
  yDown: number | null = null;
  timeDown: number | null = null;

  ngOnInit(): void {
    // needed to have the same reference in the event listener
    this.onDown = this.onDown.bind(this);
    this.onUp = this.onUp.bind(this);

    this.addDownListener();
  }

  ngOnDestroy(): void {
    this.removeDownListener();
    this.removeUpListener();
  }

  onDown(e: PointerEvent): void {
    this.timeDown = Date.now();
    this.xDown = e.clientX;
    this.yDown = e.clientY;

    this.addUpListener();
  }

  onUp(event: PointerEvent | DragEvent | TouchEvent): void {
    this.removeUpListener();

    const timeDiff = Date.now() - this.timeDown!;
    if (timeDiff >= this.swipeTimeoutMs()) return;

    const up =
      event instanceof TouchEvent
        ? {
            x: event.changedTouches[0].clientX,
            y: event.changedTouches[0].clientY,
          }
        : { x: event.clientX, y: event.clientY };

    const xDiff = this.xDown! - up.x;
    const yDiff = this.yDown! - up.y;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      if (Math.abs(xDiff) > this.swipeThresholdPx()) {
        if (xDiff > 0) {
          this.ngZone.run(() => this.swipeLeft.emit(event));
        } else {
          this.ngZone.run(() => this.swipeRight.emit(event));
        }
      }
    } else if (Math.abs(yDiff) > this.swipeThresholdPx()) {
      if (yDiff > 0) {
        this.ngZone.run(() => this.swipeUp.emit(event));
      } else {
        this.ngZone.run(() => this.swipeDown.emit(event));
      }
    }

    this.xDown = null;
    this.yDown = null;
    this.timeDown = null;
  }

  addDownListener(): void {
    this.ngZone.runOutsideAngular(() => {
      this.document.addEventListener('pointerdown', this.onDown, { passive: true });
    });
  }

  removeDownListener(): void {
    this.ngZone.runOutsideAngular(() => {
      this.document.removeEventListener('pointerdown', this.onDown);
    });
  }

  addUpListener(): void {
    this.ngZone.runOutsideAngular(() => {
      this.document.addEventListener('pointerup', this.onUp, { passive: true });
      this.document.addEventListener('touchend', this.onUp, { passive: true });
      this.document.addEventListener('dragend', this.onUp, { passive: true });
    });
  }

  removeUpListener(): void {
    this.ngZone.runOutsideAngular(() => {
      this.document.removeEventListener('pointerup', this.onUp);
      this.document.removeEventListener('touchend', this.onUp);
      this.document.removeEventListener('dragend', this.onUp);
    });
  }
}

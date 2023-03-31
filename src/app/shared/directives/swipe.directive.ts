import {
  Directive,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Directive({
  selector: '[tSwipe]',
  standalone: true,
})
export class SwipeDirective implements OnInit, OnDestroy {
  ngZone = inject(NgZone);
  document = inject(DOCUMENT);

  @Input() swipeDisabled = false;

  @Output() swipeLeft = new EventEmitter<void>();
  @Output() swipeRight = new EventEmitter<void>();

  swipeThreshold = 20; // px
  swipeTimeout = 500; // ms

  xDown: number | null = null;
  yDown: number | null = null;
  xDiff: number | null = null;
  yDiff: number | null = null;
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
    this.xDiff = 0;
    this.yDiff = 0;

    this.addUpListener();
  }

  onUp(event: PointerEvent | DragEvent | TouchEvent): void {
    this.removeUpListener();

    const timeDiff = Date.now() - this.timeDown!;
    let swipeDirection = '';
    const up =
      event instanceof TouchEvent
        ? {
            x: event.changedTouches[0].clientX,
            y: event.changedTouches[0].clientY,
          }
        : { x: event.clientX, y: event.clientY };

    this.xDiff = this.xDown! - up.x;
    this.yDiff = this.yDown! - up.y;

    if (Math.abs(this.xDiff) > Math.abs(this.yDiff)) {
      if (Math.abs(this.xDiff) > this.swipeThreshold && timeDiff < this.swipeTimeout) {
        if (this.xDiff > 0) {
          swipeDirection = 'swiped-left';
        } else {
          swipeDirection = 'swiped-right';
        }
      }
    } else if (Math.abs(this.yDiff) > this.swipeThreshold && timeDiff < this.swipeTimeout) {
      if (this.yDiff > 0) {
        swipeDirection = 'swiped-up';
      } else {
        swipeDirection = 'swiped-down';
      }
    }

    if (swipeDirection !== '') {
      if (swipeDirection === 'swiped-left') {
        this.ngZone.run(() => this.swipeLeft.emit());
      } else if (swipeDirection === 'swiped-right') {
        this.ngZone.run(() => this.swipeRight.emit());
      }
    }

    // reset values
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

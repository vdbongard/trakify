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

  down: { x: number; y: number } | null = null;

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

  onDown(event: PointerEvent): void {
    if (this.swipeDisabled) return;

    this.addUpListener();

    this.down = { x: event.clientX, y: event.clientY };
  }

  onUp(event: PointerEvent | DragEvent | TouchEvent): void {
    this.removeUpListener();

    if (this.swipeDisabled) return;

    const up =
      event instanceof TouchEvent
        ? {
            x: event.changedTouches[0].clientX,
            y: event.changedTouches[0].clientY,
          }
        : { x: event.clientX, y: event.clientY };

    if (isSwipeRight(this.down, up)) {
      this.down = null;
      this.ngZone.run(() => this.swipeRight.emit());
    } else if (isSwipeLeft(this.down, up)) {
      this.down = null;
      this.ngZone.run(() => this.swipeLeft.emit());
    }
  }
}

export function isSwipeRight(
  down: { x: number; y: number } | null,
  up: { x: number; y: number } | null
): boolean {
  if (!down || !up) return false;
  return up.x - down.x > 50;
}

export function isSwipeLeft(
  down: { x: number; y: number } | null,
  up: { x: number; y: number } | null
): boolean {
  if (!down || !up) return false;
  return up.x - down.x < -50;
}

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

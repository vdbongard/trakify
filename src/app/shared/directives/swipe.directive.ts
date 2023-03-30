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

@Directive({
  selector: '[tSwipe]',
  standalone: true,
})
export class SwipeDirective implements OnInit, OnDestroy {
  ngZone = inject(NgZone);

  @Input() disabled = false;

  @Output() swipeLeft = new EventEmitter<void>();
  @Output() swipeRight = new EventEmitter<void>();

  down: { x: number; y: number } | null = null;

  ngOnInit(): void {
    console.log('init');

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
      // todo inject document
      document.addEventListener('pointerdown', this.onDown, { passive: true });
    });
  }

  removeDownListener(): void {
    this.ngZone.runOutsideAngular(() => {
      document.removeEventListener('pointerdown', this.onDown);
    });
  }

  addUpListener(): void {
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('pointerup', this.onUp, { passive: true });
      document.addEventListener('touchend', this.onUp, { passive: true });
      document.addEventListener('dragend', this.onUp, { passive: true });
    });
  }

  removeUpListener(): void {
    this.ngZone.runOutsideAngular(() => {
      document.removeEventListener('pointerup', this.onUp);
      document.removeEventListener('touchend', this.onUp);
      document.removeEventListener('dragend', this.onUp);
    });
  }

  onDown(event: PointerEvent): void {
    console.log('down', event, this.disabled);
    if (this.disabled) return;

    this.addUpListener();

    this.down = { x: event.clientX, y: event.clientY };
  }

  onUp(event: PointerEvent | DragEvent | TouchEvent): void {
    console.log('up', event);
    this.removeUpListener();

    if (this.disabled) return;

    const up =
      event instanceof TouchEvent
        ? {
            x: event.changedTouches[0].clientX,
            y: event.changedTouches[0].clientY,
          }
        : { x: event.clientX, y: event.clientY };

    if (isSwipeRight(this.down, up)) {
      this.down = null;

      this.ngZone.run(() => {
        console.log('swipe right');
        this.swipeRight.emit();
      });
    } else if (isSwipeLeft(this.down, up)) {
      this.down = null;

      this.ngZone.run(() => {
        console.log('swipe right');
        this.swipeLeft.emit();
      });
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

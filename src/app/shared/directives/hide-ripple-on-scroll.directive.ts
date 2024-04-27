import {
  Directive,
  ElementRef,
  HostListener,
  NgZone,
  type OnDestroy,
  type OnInit,
  inject,
} from '@angular/core';
import { MatRipple } from '@angular/material/core';
import type { Position } from '@type/Number';
import { Subject, debounceTime, fromEvent, take, takeUntil } from 'rxjs';

@Directive({
  selector: '[tHideRippleOnScroll]',
  standalone: true,
})
export class HideRippleOnScrollDirective implements OnInit, OnDestroy {
  ref = inject(ElementRef);
  matRipple = inject(MatRipple);
  ngZone = inject(NgZone);

  private readonly destroy$ = new Subject<void>();

  private readonly touchTapDelay = 100;

  private isClick = new Subject<undefined>();
  private downPosition?: Position;
  private currentPosition?: Position;
  private isNearThreshold = 10; // in px
  private timeoutId?: number;

  private pointerDownEvents = ['mousedown', 'touchstart'];
  private pointerUpEvents = ['mouseup', 'mouseleave', 'touchend', 'touchcancel', 'dragstart'];
  private pointerMoveEvents = ['pointermove', 'touchmove'];
  private pointerUpEventsRegistered = false;
  private pointerMoveEventsRegistered = false;
  private isPointerDown = false;
  private isTouch = false;

  ngOnInit(): void {
    this.matRipple.disabled = true;

    this.ngZone.runOutsideAngular(() => {
      fromEvent(window, 'scroll')
        .pipe(debounceTime(10), takeUntil(this.destroy$))
        .subscribe(() => {
          this.matRipple.fadeOutAll();
        });
    });
  }

  ngOnDestroy(): void {
    this.removeEvents();
    clearTimeout(this.timeoutId);
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('pointerdown', ['$event'])
  private onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.isTouch = event.pointerType === 'touch';
    this.isPointerDown = true;
    this.downPosition = { x: event.clientX, y: event.clientY };
    this.currentPosition = { x: event.clientX, y: event.clientY };

    this.isClick.pipe(take(1), takeUntil(this.destroy$)).subscribe(() => {
      this.matRipple.launch(event.x, event.y, { persistent: true });
      clearTimeout(this.timeoutId);
    });

    if (!this.pointerUpEventsRegistered) {
      this.registerEvents(this.pointerUpEvents);
      this.pointerUpEventsRegistered = true;
    }

    if (this.isTouch) {
      clearTimeout(this.timeoutId);
      this.timeoutId = window.setTimeout(() => {
        if (this.isNear(this.currentPosition, this.downPosition)) {
          this.isClick.next(undefined);
        }
      }, this.touchTapDelay);

      if (!this.pointerMoveEventsRegistered) {
        this.registerEvents(this.pointerMoveEvents);
        this.pointerMoveEventsRegistered = true;
      }
    } else {
      this.isClick.next(undefined);
    }
  }

  private registerEvents(eventTypes: string[]): void {
    this.ngZone.runOutsideAngular(() => {
      eventTypes.forEach((type) => {
        this.ref.nativeElement.addEventListener(type, this, { passive: true });
      });
    });
  }

  private removeEvents(): void {
    if (this.ref) {
      this.pointerDownEvents.forEach((type) => {
        this.ref.nativeElement.removeEventListener(type, this, { passive: true });
      });

      if (this.pointerUpEventsRegistered) {
        this.pointerUpEvents.forEach((type) => {
          this.ref.nativeElement.removeEventListener(type, this, { passive: true });
        });
      }

      if (this.pointerMoveEventsRegistered) {
        this.pointerMoveEvents.forEach((type) => {
          this.ref.nativeElement.removeEventListener(type, this, { passive: true });
        });
      }
    }
  }

  // noinspection JSUnusedLocalSymbols
  private handleEvent(event: Event): void {
    if (event.type === 'pointermove') {
      this.onPointerMove(event as PointerEvent);
    } else if (event.type === 'touchmove') {
      this.onTouchMove(event as TouchEvent);
    } else {
      void this.onPointerUp();
    }
  }

  private onPointerMove(event: PointerEvent): void {
    this.currentPosition = { x: event.clientX, y: event.clientY };
  }

  private onTouchMove(event: TouchEvent): void {
    this.currentPosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }

  private onPointerUp(): void {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    if (this.isNear(this.currentPosition, this.downPosition)) {
      this.isClick.next(undefined);
      clearTimeout(this.timeoutId);
    }
    this.matRipple.fadeOutAll();
  }

  private isNear(a?: Position, b?: Position): boolean {
    if (!a || !b) return false;
    return Math.abs(a.x - b.x) < this.isNearThreshold && Math.abs(a.y - b.y) < this.isNearThreshold;
  }
}

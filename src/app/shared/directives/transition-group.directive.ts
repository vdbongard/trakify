import {
  AfterViewInit,
  ContentChildren,
  Directive,
  OnDestroy,
  OnInit,
  QueryList,
} from '@angular/core';
import { debounceTime, fromEvent, Subject, takeUntil } from 'rxjs';

import { TransitionGroupItemDirective } from './transition-group-item.directive';

@Directive({
  selector: '[tTransitionGroup]',
})
export class TransitionGroupDirective implements OnInit, AfterViewInit, OnDestroy {
  readonly destroy$ = new Subject<void>();

  @ContentChildren(TransitionGroupItemDirective) items?: QueryList<TransitionGroupItemDirective>;

  moveClass = 'move';

  ngOnInit(): void {
    fromEvent(window, 'scroll')
      .pipe(debounceTime(10), takeUntil(this.destroy$))
      .subscribe(() => this.refreshPosition('previousPosition'));
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => this.refreshPosition('previousPosition')); // save init positions on next 'tick'

    this.items?.changes
      .pipe(takeUntil(this.destroy$))
      .subscribe((items: QueryList<TransitionGroupItemDirective>) => {
        items.forEach(
          (item) => (item.previousPosition = item.newPosition || item.previousPosition)
        );
        items.forEach((item) => item.onMove?.());
        this.refreshPosition('newPosition');
        items.forEach(
          (item) => (item.previousPosition = item.previousPosition || item.newPosition)
        ); // for new items

        const animate = (): void => {
          items.forEach(this.applyTranslation);
          // @ts-ignore
          this['_forceReflow'] = document.body.offsetHeight; // force reflow to put everything in position
          this.items?.forEach(this.runTransition.bind(this));
        };

        const willMoveSome = items.some((item) => {
          if (!item.previousPosition || !item.newPosition) return false;
          const dx = item.previousPosition.left - item.newPosition.left;
          const dy = item.previousPosition.top - item.newPosition.top;
          return !!dx || !!dy;
        });

        if (willMoveSome) {
          animate();
        } else {
          requestAnimationFrame(() => {
            // for removed items
            this.refreshPosition('newPosition');
            animate();
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  runTransition(item: TransitionGroupItemDirective): void {
    if (!item.moved) return;

    item.element.classList.add(this.moveClass);
    item.element.style.transform = item.element.style.transitionDuration = '';
    item.element.addEventListener(
      'transitionend',
      (item.onMove = (event?: TransitionEvent): void => {
        if (!event || /transform$/.test(event.propertyName)) {
          if (item.onMove) item.element.removeEventListener('transitionend', item.onMove);
          item.onMove = null;
          item.element.classList.remove(this.moveClass);
        }
      })
    );
  }

  refreshPosition(prop: 'previousPosition' | 'newPosition'): void {
    this.items?.forEach((item) => {
      item[prop] = item.element.getBoundingClientRect();
    });
  }

  applyTranslation(item: TransitionGroupItemDirective): void {
    item.moved = false;
    if (!item.previousPosition || !item.newPosition) return;
    const dx = item.previousPosition.left - item.newPosition.left;
    const dy = item.previousPosition.top - item.newPosition.top;
    if (dx || dy) {
      item.moved = true;
      item.element.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      item.element.style.transitionDuration = '0s';
    }
  }
}

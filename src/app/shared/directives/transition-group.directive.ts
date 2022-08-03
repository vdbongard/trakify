import {
  AfterViewInit,
  ContentChildren,
  Directive,
  Input,
  OnDestroy,
  QueryList,
} from '@angular/core';
import { TransitionGroupItemDirective } from './transition-group-item.directive';
import { Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[appTransitionGroup]',
})
export class TransitionGroupDirective implements AfterViewInit, OnDestroy {
  readonly destroy$ = new Subject<void>();

  @Input('appTransitionGroup') class?: string;
  @ContentChildren(TransitionGroupItemDirective) items?: QueryList<TransitionGroupItemDirective>;

  ngAfterViewInit(): void {
    requestAnimationFrame(() => this.refreshPosition('prevPos')); // save init positions on next 'tick'

    this.items?.changes
      .pipe(takeUntil(this.destroy$))
      .subscribe((items: QueryList<TransitionGroupItemDirective>) => {
        items.forEach((item) => (item.prevPos = item.newPos || item.prevPos));
        items.forEach((item) => item.moveCallback?.());
        this.refreshPosition('newPos');
        items.forEach((item) => (item.prevPos = item.prevPos || item.newPos)); // for new items

        const animate = (): void => {
          items.forEach(this.applyTranslation);
          // @ts-ignore
          this['_forceReflow'] = document.body.offsetHeight; // force reflow to put everything in position
          this.items?.forEach(this.runTransition.bind(this));
        };

        const willMoveSome = items.some((item) => {
          if (!item.prevPos || !item.newPos) return false;
          const dx = item.prevPos.left - item.newPos.left;
          const dy = item.prevPos.top - item.newPos.top;
          return !!dx || !!dy;
        });

        if (willMoveSome) {
          animate();
        } else {
          requestAnimationFrame(() => {
            // for removed items
            this.refreshPosition('newPos');
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

    const cssClass = this.class + '-move';
    let el = item.el;
    let style: CSSStyleDeclaration = el.style;
    el.classList.add(cssClass);
    style.transform = style.transitionDuration = '';
    el.addEventListener(
      'transitionend',
      (item.moveCallback = (event?: TransitionEvent): void => {
        if (!event || /transform$/.test(event.propertyName)) {
          el.removeEventListener('transitionend', item.moveCallback!);
          item.moveCallback = null;
          el.classList.remove(cssClass);
        }
      })
    );
  }

  refreshPosition(prop: 'prevPos' | 'newPos'): void {
    this.items?.forEach((item) => {
      item[prop] = item.el.getBoundingClientRect();
    });
  }

  applyTranslation(item: TransitionGroupItemDirective): void {
    item.moved = false;
    if (!item.prevPos || !item.newPos) return;
    const dx = item.prevPos.left - item.newPos.left;
    const dy = item.prevPos.top - item.newPos.top;
    if (dx || dy) {
      item.moved = true;
      let style: CSSStyleDeclaration = item.el.style;
      style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      style.transitionDuration = '0s';
    }
  }
}

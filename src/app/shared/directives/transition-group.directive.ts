import { AfterContentInit, ContentChildren, Directive, Input, QueryList } from '@angular/core';
import { TransitionGroupItemDirective } from './transition-group-item.directive';

@Directive({
  selector: '[appTransitionGroup]',
})
export class TransitionGroupDirective implements AfterContentInit {
  @Input('appTransitionGroup') class?: string;

  @ContentChildren(TransitionGroupItemDirective) items?: QueryList<TransitionGroupItemDirective>;

  ngAfterContentInit(): void {
    this.refreshPosition('prevPos');
    this.items?.changes.subscribe((items: TransitionGroupItemDirective[]) => {
      items.forEach((item) => {
        item.prevPos = item.newPos || item.prevPos;
      });

      items.forEach(this.runCallback);
      this.refreshPosition('newPos');
      items.forEach(this.applyTranslation);

      // force reflow to put everything in position
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const offSet = document.body.offsetHeight;
      this.items?.forEach(this.runTransition.bind(this));
    });
  }

  runCallback(item: TransitionGroupItemDirective): void {
    if (item.moveCallback) {
      item.moveCallback();
    }
  }

  runTransition(item: TransitionGroupItemDirective): void {
    if (!item.moved) {
      return;
    }
    const cssClass = this.class + '-move';
    let el = item.el;
    let style: any = el.style;
    el.classList.add(cssClass);
    style.transform = style.WebkitTransform = style.transitionDuration = '';
    el.addEventListener(
      'transitionend',
      (item.moveCallback = (e: any) => {
        if (!e || /transform$/.test(e.propertyName)) {
          el.removeEventListener('transitionend', item.moveCallback);
          item.moveCallback = null;
          el.classList.remove(cssClass);
        }
      })
    );
  }

  refreshPosition(prop: string): void {
    this.items?.forEach((item) => {
      // @ts-ignore
      item[prop] = item.el.getBoundingClientRect();
    });
  }

  applyTranslation(item: TransitionGroupItemDirective): void {
    item.moved = false;
    if (!item.prevPos) return;
    const dx = item.prevPos.left - item.newPos.left;
    const dy = item.prevPos.top - item.newPos.top;
    if (dx || dy) {
      item.moved = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let style: any = item.el.style;
      style.transform = style.WebkitTransform = 'translate(' + dx + 'px,' + dy + 'px)';
      style.transitionDuration = '0s';
    }
  }
}

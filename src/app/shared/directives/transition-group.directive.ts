import { AfterViewInit, ContentChildren, Directive, Input, QueryList } from '@angular/core';
import { TransitionGroupItemDirective } from './transition-group-item.directive';

@Directive({
  selector: '[appTransitionGroup]',
})
export class TransitionGroupDirective implements AfterViewInit {
  @Input('appTransitionGroup') class?: string;

  @ContentChildren(TransitionGroupItemDirective) items?: QueryList<TransitionGroupItemDirective>;

  ngAfterViewInit(): void {
    setTimeout(() => this.refreshPosition('prevPos'), 0); // save init positions on next 'tick'

    this.items?.changes.subscribe((items: TransitionGroupItemDirective[]) => {
      items.forEach((item) => (item.prevPos = item.newPos || item.prevPos));
      items.forEach(this.runCallback);
      this.refreshPosition('newPos');
      items.forEach((item) => (item.prevPos = item.prevPos || item.newPos)); // for new items

      const animate = (): void => {
        items.forEach(this.applyTranslation);
        // @ts-ignore
        this['_forceReflow'] = document.body.offsetHeight; // force reflow to put everything in position
        this.items?.forEach(this.runTransition.bind(this));
      };

      const willMoveSome = items.some((item) => {
        if (!item.prevPos || !item.newPos) return;
        const dx = item.prevPos.left - item.newPos.left;
        const dy = item.prevPos.top - item.newPos.top;
        return dx || dy;
      });

      if (willMoveSome) {
        animate();
      } else {
        setTimeout(() => {
          // for removed items
          this.refreshPosition('newPos');
          animate();
        }, 0);
      }
    });
  }

  runCallback(item: TransitionGroupItemDirective): void {
    item.moveCallback?.();
  }

  runTransition(item: TransitionGroupItemDirective): void {
    if (!item.moved) {
      return;
    }
    const cssClass = this.class + '-move';
    let el = item.el;
    let style: CSSStyleDeclaration = el.style;
    el.classList.add(cssClass);
    style.transform = style.transitionDuration = '';
    el.addEventListener(
      'transitionend',
      (item.moveCallback = (e?: TransitionEvent): void => {
        if (!e || /transform$/.test(e.propertyName)) {
          el.removeEventListener('transitionend', item.moveCallback!);
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

import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appTransitionGroupItem]',
})
export class TransitionGroupItemDirective {
  prevPos?: DOMRect;
  newPos?: DOMRect;
  el: HTMLElement;
  moved?: boolean;
  moveCallback?: ((event?: TransitionEvent) => void) | null;

  constructor(elRef: ElementRef) {
    this.el = elRef.nativeElement;
  }
}

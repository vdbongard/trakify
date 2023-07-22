import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[tTransitionGroupItem]',
  standalone: true,
})
export class TransitionGroupItemDirective {
  ref = inject(ElementRef);

  previousPosition?: DOMRect;
  newPosition?: DOMRect;
  element: HTMLElement;
  moved?: boolean;
  onMove?: ((event?: TransitionEvent) => void) | null;

  constructor() {
    this.element = this.ref.nativeElement as HTMLElement;
  }
}

import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[tTransitionGroupItem]',
  standalone: true,
})
export class TransitionGroupItemDirective {
  previousPosition?: DOMRect;
  newPosition?: DOMRect;
  element: HTMLElement;
  moved?: boolean;
  onMove?: ((event?: TransitionEvent) => void) | null;

  constructor(private ref: ElementRef) {
    this.element = ref.nativeElement;
  }
}

import { Directive, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { primeKeyboard } from '@helper/prime-keyboard';

@Directive({
  selector: '[tPrimeKeyboard]',
  host: {
    '(pointerdown)': 'prime()',
    '(click)': 'prime()',
  },
})
export class PrimeKeyboardDirective {
  document = inject(DOCUMENT);

  prime(): void {
    primeKeyboard(this.document);
  }
}

import { Component, effect, input, numberAttribute, signal } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 't-spinner',
  imports: [MatProgressSpinner],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.scss',
})
export class SpinnerComponent {
  readonly loadingDelay = input(800, { transform: numberAttribute });

  readonly spinnerVisible = signal(false);
  private spinnerTimeout?: number;

  constructor() {
    effect(() => {
      clearTimeout(this.spinnerTimeout);
      this.spinnerTimeout = setTimeout(() => {
        this.spinnerVisible.set(true);
      }, this.loadingDelay());
    });
  }
}

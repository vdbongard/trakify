import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  input,
  signal,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { LoadingState } from '@type/Loading';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';

@Component({
  selector: 't-loading',
  imports: [NgTemplateOutlet, MatProgressSpinnerModule, SpinnerComponent],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingComponent {
  injector = inject(Injector);
  loadingState = input.required<LoadingState>();
  customLoading = input<TemplateRef<boolean>>();
  customError = input<TemplateRef<boolean>>();
  showErrorTemplate = input(false, { transform: booleanAttribute });
  showLoading = input(true, { transform: booleanAttribute });

  private readonly loadingDelay = 800; // ms
  private readonly minimumLoadingShown = 600; // ms

  readonly spinnerVisible = signal(false);
  private spinnerTimeout?: number;

  _delayedLoadingEffect = effect(() => {
    const state = this.loadingState();
    clearTimeout(this.spinnerTimeout);
    if (state === 'loading') {
      // Wait for loadingDelay, then show spinner
      this.spinnerTimeout = setTimeout(() => {
        this.spinnerVisible.set(true);
      }, this.loadingDelay);
    } else {
      // If spinner is visible, keep it for minimumLoadingShown
      if (this.spinnerVisible()) {
        this.spinnerTimeout = setTimeout(() => {
          this.spinnerVisible.set(false);
        }, this.minimumLoadingShown);
      } else {
        this.spinnerVisible.set(false);
      }
    }
  });
}

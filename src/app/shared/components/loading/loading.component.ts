import {
  booleanAttribute,
  Component,
  DestroyRef,
  inject,
  Injector,
  input,
  OnChanges,
  signal,
  Signal,
  TemplateRef,
} from '@angular/core';
import { NgIfContext, NgTemplateOutlet } from '@angular/common';
import {
  combineLatest,
  distinctUntilChanged,
  EMPTY,
  map,
  merge,
  of,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  timer,
} from 'rxjs';
import { LoadingState } from '@type/Enum';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SimpleChangesTyped } from '@type/SimpleChanges';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';

@Component({
  selector: 't-loading',
  imports: [NgTemplateOutlet, MatProgressSpinnerModule, SpinnerComponent],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss',
})
export class LoadingComponent implements OnChanges {
  destroyRef = inject(DestroyRef);
  injector = inject(Injector);

  loadingState = input.required<LoadingState>();
  customLoading = input<TemplateRef<NgIfContext<boolean>>>();
  customError = input<TemplateRef<NgIfContext<boolean>>>();
  showErrorTemplate = input(false, { transform: booleanAttribute });
  showLoading = input(true, { transform: booleanAttribute });

  private readonly loadingDelay = 800; // ms
  private readonly minimumLoadingShown = 600; // ms

  loadingStateChanged = new Subject<void>();
  isLoadingDelayed: Signal<boolean | undefined> = signal(undefined);
  state = LoadingState;

  ngOnChanges(changes: SimpleChangesTyped<this>): void {
    if (changes.loadingState) {
      const loadingState = toObservable(this.loadingState, { injector: this.injector });
      this.loadingStateChanged.next();

      loadingState
        .pipe(takeUntil(this.loadingStateChanged), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          const isNotLoading = loadingState.pipe(
            switchMap((state) => (state !== LoadingState.LOADING ? of(undefined) : EMPTY)),
          );

          this.isLoadingDelayed = toSignal(
            merge(
              // ON in this.loadingDelay
              timer(this.loadingDelay).pipe(
                map(() => true),
                takeUntil(isNotLoading),
              ),
              // OFF once loading is finished, yet at least this.minimumLoadingShown
              combineLatest([
                isNotLoading,
                timer(this.loadingDelay + this.minimumLoadingShown),
              ]).pipe(map(() => false)),
            ).pipe(startWith(false), distinctUntilChanged()),
            { injector: this.injector },
          );
        });
    }
  }
}

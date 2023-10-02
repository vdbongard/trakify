import {
  Component,
  DestroyRef,
  inject,
  Injector,
  Input,
  OnChanges,
  signal,
  Signal,
  TemplateRef,
  WritableSignal,
} from '@angular/core';
import { CommonModule, NgIfContext } from '@angular/common';
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

@Component({
  selector: 't-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
})
export class LoadingComponent implements OnChanges {
  destroyRef = inject(DestroyRef);
  injector = inject(Injector);

  @Input({ required: true }) loadingState!: WritableSignal<LoadingState>;
  @Input() customLoading?: TemplateRef<NgIfContext<boolean>>;
  @Input() customError?: TemplateRef<NgIfContext<boolean>>;
  @Input() showErrorTemplate = false;

  private readonly loadingDelay = 800; // ms
  private readonly minimumLoadingShown = 600; // ms

  loadingStateChanged = new Subject<void>();
  isLoadingDelayed: Signal<boolean | undefined> = signal(undefined);
  state = LoadingState;

  ngOnChanges(changes: SimpleChangesTyped<this>): void {
    const loadingState = toObservable(changes.loadingState?.currentValue, {
      injector: this.injector,
    });
    if (loadingState) {
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

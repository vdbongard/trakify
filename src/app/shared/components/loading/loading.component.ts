import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { AsyncPipe, NgIf, NgIfContext } from '@angular/common';
import {
  combineLatest,
  distinctUntilChanged,
  EMPTY,
  map,
  merge,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  timer,
} from 'rxjs';

import { Base } from '@helper/base';

import { LoadingState } from '@type/enum';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 't-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatProgressSpinnerModule, NgIf, AsyncPipe],
})
export class LoadingComponent extends Base implements OnChanges {
  @Input() loadingState?: Observable<LoadingState>;
  @Input() customLoading?: TemplateRef<NgIfContext<boolean>>;
  @Input() customError?: TemplateRef<NgIfContext<boolean>>;
  @Input() showErrorTemplate = false;

  private readonly loadingDelay = 800; // ms
  private readonly minimumLoadingShown = 600; // ms

  loadingStateChanged = new Subject<void>();
  isLoadingDelayed?: Observable<boolean>;
  state = LoadingState;

  constructor(private cdr: ChangeDetectorRef) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const loadingState = changes['loadingState']?.currentValue as
      | Observable<LoadingState>
      | undefined;
    if (loadingState) {
      this.loadingStateChanged.next();

      loadingState
        .pipe(takeUntil(this.loadingStateChanged), takeUntil(this.destroy$))
        .subscribe(() => {
          this.cdr.markForCheck();
          const isNotLoading = loadingState.pipe(
            switchMap((state) => (state !== LoadingState.LOADING ? of(undefined) : EMPTY))
          );

          this.isLoadingDelayed = merge(
            // ON in this.loadingDelay
            timer(this.loadingDelay).pipe(
              map(() => true),
              takeUntil(isNotLoading)
            ),
            // OFF once loading is finished, yet at least this.minimumLoadingShown
            combineLatest([isNotLoading, timer(this.loadingDelay + this.minimumLoadingShown)]).pipe(
              map(() => false)
            )
          ).pipe(startWith(false), distinctUntilChanged());
        });
    }
  }
}

import { Component, Input, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  EMPTY,
  map,
  merge,
  Observable,
  of,
  startWith,
  switchMap,
  takeUntil,
  timer,
} from 'rxjs';
import { LoadingState } from '../../../../types/enum';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
})
export class LoadingComponent implements OnChanges {
  @Input() loadingState?: Observable<LoadingState>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() customLoading?: TemplateRef<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() customError?: TemplateRef<any>;

  private readonly loadingDelay = 400; // ms
  private readonly minimumLoadingShown = 600; // ms

  isLoadingDelayed?: Observable<boolean>;
  loadingStateEnum = LoadingState;

  ngOnChanges(changes: SimpleChanges): void {
    const loadingState = changes['loadingState']?.currentValue as
      | Observable<LoadingState>
      | undefined;
    if (loadingState) {
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
    }
  }
}

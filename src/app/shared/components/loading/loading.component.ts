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
  Subject,
  switchMap,
  takeUntil,
  timer,
} from 'rxjs';
import { LoadingState } from '../../../../types/enum';
import { BaseComponent } from '../../helper/base-component';
import { NgIfContext } from '@angular/common';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
})
export class LoadingComponent extends BaseComponent implements OnChanges {
  @Input() loadingState?: Observable<LoadingState>;
  @Input() customLoading?: TemplateRef<NgIfContext<boolean>>;
  @Input() customError?: TemplateRef<NgIfContext<boolean>>;

  private readonly loadingDelay = 400; // ms
  private readonly minimumLoadingShown = 600; // ms

  loadingStateChanged = new Subject<void>();
  isLoadingDelayed?: Observable<boolean>;
  loadingStateEnum = LoadingState;

  ngOnChanges(changes: SimpleChanges): void {
    const loadingState = changes['loadingState']?.currentValue as
      | Observable<LoadingState>
      | undefined;
    if (loadingState) {
      this.loadingStateChanged.next();

      loadingState
        .pipe(takeUntil(this.loadingStateChanged), takeUntil(this.destroy$))
        .subscribe(() => {
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

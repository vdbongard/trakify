import { Component, Input, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  merge,
  Observable,
  startWith,
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

  isLoadingDelayed?: Observable<boolean>;
  loadingStateEnum = LoadingState;

  ngOnChanges(changes: SimpleChanges): void {
    const loadingState = changes['loadingState']?.currentValue as
      | Observable<LoadingState>
      | undefined;
    if (loadingState) {
      const isLoading = loadingState.pipe(map((state) => state === LoadingState.LOADING));
      this.isLoadingDelayed = merge(
        // ON in 1s
        timer(800).pipe(
          map(() => true),
          takeUntil(isLoading)
        ),
        // OFF once loading is finished, yet at least in 2s
        combineLatest([isLoading, timer(1600)]).pipe(map(() => false))
      ).pipe(startWith(false), distinctUntilChanged());
    }
  }
}

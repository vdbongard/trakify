import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ShowProgress, ShowWatched } from '../../../../types/interfaces/Trakt';
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
import { Show, TmdbConfiguration } from '../../../../types/interfaces/Tmdb';

@Component({
  selector: 'app-shows',
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.scss'],
})
export class ShowsComponent implements OnInit, OnChanges {
  @Input() shows: {
    showWatched: ShowWatched;
    showProgress: ShowProgress;
    tmdbShow: Show;
    favorite: boolean;
  }[] = [];
  @Input() isLoading?: Observable<boolean>;
  @Input() tmdbConfig?: TmdbConfiguration | null;

  @Output() addFavorite = new EventEmitter();
  @Output() removeFavorite = new EventEmitter();

  isLoadingDelayed?: Observable<boolean>;

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isLoading']?.currentValue) {
      this.isLoadingDelayed = merge(
        // ON in 1s
        timer(1000).pipe(
          map(() => true),
          takeUntil(changes['isLoading'].currentValue)
        ),
        // OFF once we loading is finished, yet at least in 2s
        combineLatest([this.isLoading, timer(2000)]).pipe(map(() => false))
      ).pipe(startWith(false), distinctUntilChanged());
    }
  }

  showId(index: number, show: { showWatched: ShowWatched; showProgress: ShowProgress }): number {
    return show.showWatched.show.ids.trakt;
  }
}

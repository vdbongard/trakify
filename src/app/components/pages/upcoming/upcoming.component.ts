import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Subscription, tap } from 'rxjs';
import { ShowService } from '../../../services/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { EpisodeFull } from '../../../../types/interfaces/Trakt';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { wait } from '../../../helper/wait';

@Component({
  selector: 'app-upcoming',
  templateUrl: './upcoming.component.html',
  styleUrls: ['./upcoming.component.scss'],
})
export class UpcomingComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  shows: ShowInfo[] = [];
  isLoading = new BehaviorSubject<boolean>(false);

  constructor(public showService: ShowService, public tmdbService: TmdbService) {}

  ngOnInit(): void {
    this.subscriptions = [
      combineLatest([this.showService.fetchCalendar(), this.tmdbService.tmdbShows])
        .pipe(
          tap(() => {
            this.shows = [];
            this.isLoading.next(true);
          })
        )
        .subscribe(async ([episodesAiring, tmdbShows]) => {
          episodesAiring.forEach((episodeAiring) => {
            const episodeFull: Partial<EpisodeFull> = episodeAiring.episode;
            episodeFull.first_aired = episodeAiring.first_aired;

            this.shows.push({
              show: episodeAiring.show,
              tmdbShow: tmdbShows[episodeAiring.show.ids.tmdb],
              nextEpisode: episodeFull as EpisodeFull,
            });
          });
          await wait();
          this.isLoading.next(false);
        }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

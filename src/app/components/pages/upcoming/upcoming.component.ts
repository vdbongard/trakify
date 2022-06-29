import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, forkJoin, Subscription, switchMap, tap } from 'rxjs';
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
  showsTmp: ShowInfo[] = [];
  isLoading = new BehaviorSubject<boolean>(false);

  constructor(public showService: ShowService, public tmdbService: TmdbService) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.showService
        .fetchCalendar()
        .pipe(
          tap(() => {
            this.showsTmp = [];
            this.isLoading.next(true);
          }),
          switchMap((episodesAiring) => {
            episodesAiring.forEach((episodeAiring) => {
              const episodeFull: Partial<EpisodeFull> = episodeAiring.episode;
              episodeFull.first_aired = episodeAiring.first_aired;

              this.showsTmp.push({
                show: episodeAiring.show,
                nextEpisode: episodeFull as EpisodeFull,
              });
            });
            return forkJoin(
              episodesAiring.map((episodeAiring) =>
                this.tmdbService.fetchShow(episodeAiring.show.ids.tmdb)
              )
            );
          })
        )
        .subscribe(async (tmdbShows) => {
          tmdbShows.forEach((tmdbShow, i) => {
            this.showsTmp[i] = { ...this.showsTmp[i], tmdbShow };
          });
          this.shows = this.showsTmp;
          await wait();
          this.isLoading.next(false);
        }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

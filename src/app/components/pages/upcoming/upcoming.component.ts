import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, forkJoin, switchMap, tap } from 'rxjs';
import { ShowService } from '../../../services/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { EpisodeFull } from '../../../../types/interfaces/Trakt';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { wait } from '../../../helper/wait';
import { BaseComponent } from '../../../helper/base-component';

@Component({
  selector: 'app-upcoming',
  templateUrl: './upcoming.component.html',
  styleUrls: ['./upcoming.component.scss'],
})
export class UpcomingComponent extends BaseComponent implements OnInit {
  shows: ShowInfo[] = [];
  showsTmp: ShowInfo[] = [];
  isLoading = new BehaviorSubject<boolean>(false);

  constructor(public showService: ShowService, public tmdbService: TmdbService) {
    super();
  }

  ngOnInit(): void {
    this.showService
      .fetchCalendar(198)
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
              this.tmdbService.fetchTmdbShow(episodeAiring.show.ids.tmdb)
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
      });
  }
}

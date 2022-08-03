import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap, takeUntil } from 'rxjs';
import { ShowService } from '../../../services/trakt/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { BaseComponent } from '../../../helper/base-component';
import { EpisodeAiring, EpisodeFull } from '../../../../types/interfaces/Trakt';
import { TmdbShow } from '../../../../types/interfaces/Tmdb';
import { LoadingState } from '../../../../types/enum';
import { EpisodeService } from '../../../services/trakt/episode.service';
import { onError } from '../../../helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-upcoming',
  templateUrl: './upcoming.component.html',
  styleUrls: ['./upcoming.component.scss'],
})
export class UpcomingComponent extends BaseComponent implements OnInit {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfos?: ShowInfo[];

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    private episodeService: EpisodeService,
    private snackBar: MatSnackBar
  ) {
    super();
  }

  ngOnInit(): void {
    this.episodeService
      .getUpcomingEpisodes(198)
      .pipe(
        switchMap((episodesAiring) => this.combine(episodesAiring)),
        map(this.getShowInfo),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: async (shows) => {
          if (!this.showsInfos) this.showsInfos = [];
          this.showsInfos?.push(...shows);
          this.loadingState.next(LoadingState.SUCCESS);
        },
        error: (error) => onError(error, this.snackBar, this.loadingState),
      });
  }

  combine(
    episodesAiring: EpisodeAiring[]
  ): Observable<[EpisodeAiring[], (TmdbShow | undefined)[]]> {
    return combineLatest([
      of(episodesAiring),
      combineLatest(
        episodesAiring.map((episodeAiring) => this.tmdbService.getTmdbShow$(episodeAiring.show.ids))
      ),
    ]);
  }

  getShowInfo([episodesAiring, tmdbShows]: [
    EpisodeAiring[],
    (TmdbShow | undefined)[]
  ]): ShowInfo[] {
    return episodesAiring.map((episodeAiring, i): ShowInfo => {
      const episodeFull: Partial<EpisodeFull> = episodeAiring.episode;
      episodeFull.first_aired = episodeAiring.first_aired;
      return {
        show: episodeAiring.show,
        nextEpisode: episodeFull as EpisodeFull,
        tmdbShow: tmdbShows[i],
      };
    });
  }
}

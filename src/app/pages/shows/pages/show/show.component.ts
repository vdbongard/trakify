import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import { lastValueFrom, map } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { queryKeys } from '@shared/query-keys';
import { ConfigService } from '@services/config.service';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';
import { EpisodeService } from '../../data/episode.service';
import { TranslationService } from '../../data/translation.service';
import { getErrorMessage, onError } from '@helper/error';
import { ExecuteService } from '@services/execute.service';
import { SM } from '@constants';
import { LoadingState } from '@type/Loading';
import { Episode, EpisodeFull, Show } from '@type/Trakt';
import { ListService } from '../../../lists/data/list.service';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { ShowHeaderComponent } from './ui/show-header/show-header.component';
import { ShowCastComponent } from './ui/show-cast/show-cast.component';
import { ShowDetailsComponent } from './ui/show-details/show-details.component';
import { ShowNextEpisodeComponent } from './ui/show-next-episode/show-next-episode.component';
import { ShowSeasonsComponent } from './ui/show-seasons/show-seasons.component';
import { ShowLinksComponent } from './ui/show-links/show-links.component';
import { TmdbShow } from '@type/Tmdb';
import { toSignal } from '@angular/core/rxjs-interop';
import { isShowEnded } from '@helper/isShowEnded';
import { toEpisodeId } from '@helper/toShowId';
import { translated } from '@helper/translation';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import { wait } from '@helper/wait';
import { ShowInfo } from '@type/Show';
import { NextEpisode } from '@type/Episode';

@Component({
  selector: 't-show',
  imports: [
    SpinnerComponent,
    ShowHeaderComponent,
    ShowCastComponent,
    ShowDetailsComponent,
    ShowNextEpisodeComponent,
    ShowSeasonsComponent,
    ShowLinksComponent,
  ],
  templateUrl: './show.component.html',
  styleUrl: './show.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ShowComponent implements OnDestroy {
  showService = inject(ShowService);
  tmdbService = inject(TmdbService);
  episodeService = inject(EpisodeService);
  snackBar = inject(MatSnackBar);
  executeService = inject(ExecuteService);
  observer = inject(BreakpointObserver);
  title = inject(Title);
  listService = inject(ListService);
  authService = inject(AuthService);
  dialogService = inject(DialogService);
  router = inject(Router);
  configService = inject(ConfigService);
  translationService = inject(TranslationService);

  show = input<string>('');

  seenLoading = signal<LoadingState>('success');
  back = history.state?.back;
  lightbox?: PhotoSwipeLightbox;
  info =
    (this.router.currentNavigation()?.extras.info as ShowInfo | undefined) ??
    (history.state?.showInfo as ShowInfo | undefined);

  isSmall = toSignal(
    this.observer.observe([`(max-width: ${SM})`]).pipe(map((breakpoint) => breakpoint.matches)),
  );

  showQuery = injectQuery(() => ({
    queryKey: queryKeys.show(this.show()),
    queryFn: (): Promise<Show> => lastValueFrom(this.showService.fetchShow(this.show())),
    enabled: !!this.show(),
    initialData: (): Show | undefined => this.info?.show,
  }));

  isError = computed(() => this.showQuery.isError());

  showErrorMessage = computed(() => getErrorMessage(this.showQuery.error(), 'Failed to load show'));

  showData = computed(() => this.showQuery.data());

  isWatchlist = computed(() => {
    const show = this.showData();
    if (!show) return false;
    return !!this.listService.watchlist
      .s()
      ?.find((watchlistItem) => watchlistItem.show.ids.trakt === show.ids.trakt);
  });

  showWatched = computed(() => {
    const show = this.showData();
    if (!show) return undefined;
    return (
      this.showService.showsWatched
        .s()
        ?.find((showWatched) => showWatched.show.ids.trakt === show.ids.trakt) ??
      this.info?.showWatched
    );
  });

  showProgress = computed(() => {
    const show = this.showData();
    if (!show) return undefined;
    const showProgress =
      this.showService.showsProgress.s()?.[show.ids.trakt] ?? this.info?.showProgress;
    if (!showProgress) return undefined;
    return { ...showProgress, seasons: [...showProgress.seasons].reverse() };
  });

  language = computed(() => this.configService.config.s().language);

  tmdbShowQuery = injectQuery(() => ({
    queryKey: queryKeys.tmdbShow(this.showData()?.ids.tmdb, this.language()),
    queryFn: (): Promise<TmdbShow> =>
      lastValueFrom(this.tmdbService.fetchTmdbShowExtended(this.showData()!)),
    enabled: !!this.showData(),
    initialData: (): TmdbShow | undefined | null => this.info?.tmdbShow,
  }));

  tmdbShow = computed(() => {
    let tmdbShow = this.tmdbShowQuery.data();
    if (!tmdbShow) return;

    if (this.showProgress()) {
      tmdbShow = { ...tmdbShow, seasons: [...tmdbShow.seasons].reverse() };
    }

    const showWithSpecialsSeasonAtEnd: TmdbShow = { ...tmdbShow, seasons: [...tmdbShow.seasons] };
    const season0Index = showWithSpecialsSeasonAtEnd.seasons.findIndex(
      (season) => season.season_number === 0,
    );
    if (season0Index >= 0) {
      // push specials season to end of array
      showWithSpecialsSeasonAtEnd.seasons.push(
        showWithSpecialsSeasonAtEnd.seasons.splice(season0Index, 1)[0],
      );
    }
    return showWithSpecialsSeasonAtEnd;
  });
  cast = computed(() => this.tmdbShow()?.aggregate_credits?.cast);

  isFavorite = computed(() => {
    const show = this.showData();
    return show ? this.showService.isFavorite(show) : false;
  });

  private nextSeasonNumber = computed(() => {
    const showProgress = this.showProgress();

    if (showProgress && showProgress.next_episode != null) {
      if (showProgress.next_episode.season === 0) return null;
      return showProgress.next_episode.season;
    }

    const tmdbShow = this.tmdbShow();
    const isEnded = tmdbShow && isShowEnded(tmdbShow);
    const showWatched = this.showWatched();
    if ((isEnded || showProgress?.next_episode === null) && showWatched) {
      return null;
    }

    return 1;
  });

  private nextEpisodeNumber = computed(() => {
    const showProgress = this.showProgress();

    if (showProgress && showProgress.next_episode != null) {
      if (showProgress.next_episode.season === 0) return null;
      return showProgress.next_episode.number;
    }

    const tmdbShow = this.tmdbShow();
    const isEnded = tmdbShow && isShowEnded(tmdbShow);
    const showWatched = this.showWatched();
    if ((isEnded || showProgress?.next_episode === null) && showWatched) {
      return null;
    }

    return 1;
  });

  nextEpisode = computed<NextEpisode | undefined>(() => {
    const show = this.showData();
    if (!show) return;

    const seasonNumber = this.nextSeasonNumber();
    const episodeNumber = this.nextEpisodeNumber();

    if (seasonNumber === null || episodeNumber === null) return [null, null, null];

    const episodeId = toEpisodeId(show.ids.trakt, seasonNumber, episodeNumber);
    const tmdbEpisodeId = show.ids.tmdb
      ? toEpisodeId(show.ids.tmdb, seasonNumber, episodeNumber)
      : undefined;

    const episode = this.episodeService.showsEpisodes.s()?.[episodeId] ?? null;
    const tmdbEpisodeData = tmdbEpisodeId
      ? (this.tmdbService.tmdbEpisodes.s()?.[tmdbEpisodeId] ?? null)
      : null;
    const showProgress = this.showProgress();
    const episodeProgress =
      showProgress?.seasons
        .find((season) => season.number === seasonNumber)
        ?.episodes.find((episode) => episode.number === episodeNumber) ?? null;

    const translation = this.translationService.showsEpisodesTranslations.s()?.[episodeId];
    const translatedEpisode = episode ? translated(episode, translation) : episode;
    const translatedTmdbEpisode = tmdbEpisodeData
      ? translated(tmdbEpisodeData, translation)
      : tmdbEpisodeData;

    return [translatedEpisode, translatedTmdbEpisode, episodeProgress];
  });

  nextTraktEpisode = computed(() => this.nextEpisode()?.[0] ?? null);

  tmdbSeason = computed(() => {
    const show = this.showData();
    const showProgress = this.showProgress();
    if (!show || !showProgress?.next_episode) return;
    const season = this.tmdbService.toTmdbSeason(show, showProgress);
    if (season) return season;
    return this.info?.tmdbSeason ?? undefined;
  });

  seasonEpisodesQuery = injectQuery(() => ({
    queryKey: queryKeys.seasonEpisodes(this.showData()?.ids.trakt),
    queryFn: (): Promise<Record<string, EpisodeFull[] | undefined>> => {
      const tmdbShowData = this.tmdbShow();
      const show = this.showData()!;
      return lastValueFrom(this.episodeService.fetchEpisodesFromShow(tmdbShowData, show));
    },
    enabled: !!this.tmdbShow() && !!this.showData() && !isShowEnded(this.tmdbShow()!),
  }));

  seasonEpisodes = computed(() => this.seasonEpisodesQuery.data());

  readonly handleShowError = effect(() => {
    const error = this.showQuery.error();
    if (error) {
      console.error('show', error);
      this.snackBar.open(getErrorMessage(error, 'Failed to load show'), 'Reload', {
        duration: 6000,
      });
    }
  });

  readonly handleTmdbError = effect(() => {
    const error = this.tmdbShowQuery.error();
    if (error) {
      console.error('tmdbShow', error);
      this.snackBar.open(getErrorMessage(error, 'Failed to load show details'), 'Reload', {
        duration: 6000,
      });
    }
  });

  readonly setTitleAndActiveShow = effect(() => {
    const show = this.showData();
    if (show) {
      this.title.setTitle(`${show.title} - Trakify`);
      this.showService.activeShow.set({ ...show });
    }
  });

  readonly updateLightbox = effect(async () => {
    if (!this.showQuery.isSuccess()) return;

    // wait for image load
    await wait(500);

    this.lightbox?.destroy();
    this.lightbox = new PhotoSwipeLightbox({
      gallery: '.image-link',
      pswpModule: (): Promise<unknown> => import('photoswipe'),
    });
    this.lightbox.init();
  });

  ngOnDestroy(): void {
    this.lightbox?.destroy();
    this.showService.activeShow.set(undefined);
  }

  async addToHistory(episode: Episode | undefined, show: Show): Promise<void> {
    if (!episode) throw Error('Episode is empty (addToHistory)');
    try {
      await this.executeService.addEpisode(episode, show, this.seenLoading);
    } catch (error) {
      onError(error, this.snackBar, [this.seenLoading]);
    }
  }
}

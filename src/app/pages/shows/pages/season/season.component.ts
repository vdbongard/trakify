import { Component, computed, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { lastValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { queryKeys } from '@shared/query-keys';
import { ShowService } from '../../data/show.service';
import { SeasonService } from '../../data/season.service';
import { ExecuteService } from '@services/execute.service';
import { EpisodeFull, Season, SeasonProgress, Show } from '@type/Trakt';
import { AuthService } from '@services/auth.service';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { ErrorText } from '@shared/components/error-text/error-text.component';
import { SeasonHeaderComponent } from './ui/season-header/season-header.component';
import { SeasonEpisodesComponent } from './ui/season-episodes/season-episodes.component';
import { seasonTitle } from '@helper/seasonTitle';
import { BreadcrumbPart } from '@type/Breadcrumb';

@Component({
  selector: 't-season',
  imports: [SpinnerComponent, ErrorText, SeasonHeaderComponent, SeasonEpisodesComponent],
  templateUrl: './season.component.html',
  styleUrl: './season.component.scss',
})
export default class SeasonComponent implements OnDestroy {
  showService = inject(ShowService);
  seasonService = inject(SeasonService);
  executeService = inject(ExecuteService);
  title = inject(Title);
  authService = inject(AuthService);

  show = input<string>('');
  season = input<string>('');

  breadcrumbParts = signal<BreadcrumbPart[]>([]);

  showQuery = injectQuery(() => ({
    queryKey: queryKeys.show(this.show()),
    queryFn: (): Promise<Show> => lastValueFrom(this.showService.fetchShow(this.show())),
  }));

  seasonProgress = computed<SeasonProgress | undefined>(() => {
    const show = this.showQuery.data();
    if (!show) return;
    const showsProgress = this.showService.showsProgress.s();
    return showsProgress?.[show.ids.trakt]?.seasons?.find(
      (s) => s.number === parseInt(this.season()),
    );
  });

  seasonsQuery = injectQuery(() => ({
    queryKey: queryKeys.seasons(this.showQuery.data()?.ids.trakt),
    queryFn: (): Promise<Season[]> =>
      lastValueFrom(this.seasonService.fetchSeasons(this.showQuery.data()!)),
    enabled: !!this.showQuery.data(),
  }));

  seasonEpisodesQuery = injectQuery(() => ({
    queryKey: queryKeys.seasonEpisodes(this.showQuery.data()?.ids.trakt, parseInt(this.season())),
    queryFn: (): Promise<EpisodeFull[]> =>
      lastValueFrom(
        this.seasonService.getSeasonEpisodes$<EpisodeFull>(
          this.showQuery.data()!,
          parseInt(this.season()),
        ),
      ),
    enabled: !!this.showQuery.data(),
  }));

  readonly setActiveShow = effect(() => {
    const show = this.showQuery.data();
    if (show) {
      this.showService.activeShow.set({ ...show });
    }
  });

  readonly setTitle = effect(async () => {
    const showData = this.showQuery.data();
    if (!showData) return;

    this.title.setTitle(
      `${seasonTitle(this.season(), this.seasonProgress()?.title)}
        - ${showData.title}
        - Trakify`,
    );
  });

  readonly setBreadcrumb = effect(() => {
    const showData = this.showQuery.data();
    if (!showData) return;

    this.breadcrumbParts.set([
      {
        name: showData.title,
        link: `/shows/s/${this.show()}`,
      },
      {
        name: seasonTitle(this.season(), this.seasonProgress()?.title),
        link: `/shows/s/${this.show()}/season/${this.season()}`,
      },
    ]);
  });

  readonly setActiveSeason = effect(() => {
    const seasons = this.seasonsQuery.data();
    const seasonProgress = this.seasonProgress();
    if (!seasonProgress || !seasons) return;
    const season = seasons.find((s) => s.number === seasonProgress.number);
    this.seasonService.activeSeason.set(season ? { ...season } : season);
  });

  ngOnDestroy(): void {
    this.showService.activeShow.set(undefined);
    this.seasonService.activeSeason.set(undefined);
  }
}

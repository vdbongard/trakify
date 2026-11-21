import { Component, computed, effect, inject } from '@angular/core';
import { StatsService } from './data/stats.service';
import type { Stats } from '@type/Trakt';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { minutesToDays } from '@helper/minutesToDays';
import { injectQuery } from '@tanstack/angular-query';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { StatsApiService } from './data/stats-api.service';
import { ErrorText } from '@shared/components/error-text/error-text.component';
import { QueryErrorNoticeService } from '@services/query-error-notice.service';
import { noticeRefreshErrors } from '@helper/queryErrorNotice';

@Component({
  selector: 't-statistics',
  imports: [MatProgressBarModule, SpinnerComponent, ErrorText],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss',
  providers: [QueryErrorNoticeService],
})
export default class StatisticsComponent {
  statsApiService = inject(StatsApiService);
  statsService = inject(StatsService);
  queryErrorNotice = inject(QueryErrorNoticeService);

  showStats = this.statsService.getShowStats();
  episodeStats = this.statsService.getEpisodeStats();

  statsQuery = injectQuery(() => ({
    queryKey: ['stats'],
    queryFn: (): Promise<Stats | null> => this.statsApiService.fetchStats(),
  }));

  daysWatched = computed(() => minutesToDays(this.statsQuery.data()?.episodes?.minutes ?? 0));

  private readonly refreshErrorNotice = effect(() => {
    if (!this.statsQuery.data()) return;
    noticeRefreshErrors(
      this.queryErrorNotice,
      [this.statsQuery.error()],
      () => void this.statsQuery.refetch(),
    );
  });
}

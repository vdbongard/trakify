import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { minutesToDays } from '@helper/minutesToDays';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { injectQuery } from '@tanstack/angular-query-experimental';
import type { Stats } from '@type/Trakt';
import { lastValueFrom } from 'rxjs';
import { StatsApiService } from './data/stats-api.service';
import { StatsService } from './data/stats.service';

@Component({
  selector: 't-statistics',
  standalone: true,
  imports: [MatProgressBarModule, SpinnerComponent],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StatisticsComponent {
  statsApiService = inject(StatsApiService);
  statsService = inject(StatsService);
  snackBar = inject(MatSnackBar);

  showStats = this.statsService.getShowStats();
  episodeStats = this.statsService.getEpisodeStats();

  statsQuery = injectQuery(() => ({
    queryKey: ['stats'],
    queryFn: (): Promise<Stats> => lastValueFrom(this.statsApiService.fetchStats()),
  }));

  daysWatched = computed(() => minutesToDays(this.statsQuery.data()?.episodes.minutes ?? 0));
}

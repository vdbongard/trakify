import { booleanAttribute, Component, computed, input } from '@angular/core';
import type { ShowProgressSummary } from '@type/ShowProgress';

@Component({
  selector: 't-episode-count',
  standalone: true,
  templateUrl: './episode-count.component.html',
  styleUrl: './episode-count.component.scss',
})
export class EpisodeCountComponent {
  progress = input<ShowProgressSummary>();
  episodes = input<number>();
  withDividerLeft = input(false, { transform: booleanAttribute });
  withDividerRight = input(false, { transform: booleanAttribute });

  totalEpisodes = computed(() => this.episodes() ?? 0);
  remainingEpisodesCount = computed(() => this.progress()?.remaining);

  episodeCount = computed<'remaining' | 'total' | undefined>(() => {
    const progress = this.progress();
    const total = this.totalEpisodes();
    if (!progress) return total > 0 ? 'total' : undefined;
    if (progress.nextEpisode.state === 'unknown') return undefined;
    if (progress.completed === 0 && total > 0) return 'total';
    return (this.remainingEpisodesCount() ?? 0) > 0 ? 'remaining' : undefined;
  });

  protected readonly Divider = '·';
}

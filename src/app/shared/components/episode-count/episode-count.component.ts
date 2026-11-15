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

  /** What the count is about: the Episodes left for a Show in progress, the whole Show when none
   *  have been seen (or Trakt has no progress for it at all), and nothing when there is nothing
   *  to count. Progress that is still unknown stays silent, so the total does not flash for a
   *  moment before the remaining count lands. */
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

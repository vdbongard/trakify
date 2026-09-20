import { booleanAttribute, Component, computed, input } from '@angular/core';
import { EpisodeFull, ShowProgress, ShowProgressCompact } from '@type/Trakt';
import { TmdbSeason } from '@type/Tmdb';
import { getRemainingEpisodes, isDetailedProgress } from '@helper/episodes';
import { NextEpisode } from '@type/Episode';

@Component({
  selector: 't-episode-count',
  standalone: true,
  templateUrl: './episode-count.component.html',
  styleUrl: './episode-count.component.scss',
})
export class EpisodeCountComponent {
  showProgress = input<ShowProgress | ShowProgressCompact>();
  nextEpisode = input<NextEpisode | EpisodeFull>();
  tmdbSeason = input<TmdbSeason>();
  episodes = input<number>();
  withDividerLeft = input(false, { transform: booleanAttribute });
  withDividerRight = input(false, { transform: booleanAttribute });

  remainingEpisodesCount = computed(() => {
    const showProgress = this.showProgress();
    if (!showProgress || showProgress.completed <= 0) return -1;

    // overview progress (no seasonal detail): remaining = aired - completed
    if (!isDetailedProgress(showProgress)) {
      return showProgress.aired - showProgress.completed;
    }

    const nextEpisode = this.nextEpisode();
    const nextEpisodeTrakt = Array.isArray(nextEpisode) ? nextEpisode[0] : nextEpisode;
    if (!nextEpisodeTrakt || !this.tmdbSeason()) return -1;
    return getRemainingEpisodes(showProgress, nextEpisodeTrakt, this.tmdbSeason());
  });

  protected readonly Divider = '·';
}

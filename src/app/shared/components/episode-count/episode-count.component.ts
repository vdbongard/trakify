import { booleanAttribute, Component, computed, input } from '@angular/core';
import { EpisodeFull, ShowProgress } from '@type/Trakt';
import { TmdbSeason } from '@type/Tmdb';
import { getRemainingEpisodes } from '@helper/episodes';
import { NextEpisode } from '../../../pages/shows/pages/show/ui/show-next-episode/show-next-episode.component';

@Component({
  selector: 't-episode-count',
  standalone: true,
  templateUrl: './episode-count.component.html',
  styleUrl: './episode-count.component.scss',
})
export class EpisodeCountComponent {
  showProgress = input<ShowProgress>();
  nextEpisode = input<NextEpisode | EpisodeFull>();
  tmdbSeason = input<TmdbSeason>();
  episodes = input<number>();
  withDividerLeft = input(false, { transform: booleanAttribute });
  withDividerRight = input(false, { transform: booleanAttribute });

  remainingEpisodesCount = computed(() => {
    const nextEpisode = this.nextEpisode();
    const nextEpisodeTrakt = Array.isArray(nextEpisode) ? nextEpisode[0] : nextEpisode;
    if (!this.showProgress() || !nextEpisodeTrakt || !this.tmdbSeason()) return -1;
    return getRemainingEpisodes(this.showProgress(), nextEpisodeTrakt, this.tmdbSeason());
  });

  divider = '·';
}

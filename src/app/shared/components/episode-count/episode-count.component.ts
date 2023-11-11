import { Component, computed, Input, Signal } from '@angular/core';
import { EpisodeFull, ShowProgress } from '@type/Trakt';
import { TmdbSeason } from '@type/Tmdb';
import { getRemainingEpisodes } from '@helper/episodes';
import { NextEpisode } from '../../../pages/shows/pages/show/ui/show-next-episode/show-next-episode.component';

@Component({
  selector: 't-episode-count',
  standalone: true,
  templateUrl: './episode-count.component.html',
  styleUrls: ['./episode-count.component.scss'],
})
export class EpisodeCountComponent {
  @Input({ required: true }) showProgress!: Signal<ShowProgress | undefined>;
  @Input({ required: true }) nextEpisode!: Signal<NextEpisode> | Signal<EpisodeFull | undefined>;
  @Input({ required: true }) tmdbSeason!: Signal<TmdbSeason | null | undefined>;
  @Input() episodes?: number;
  @Input() divider = '·';
  @Input() withDividerLeft = false;
  @Input() withDividerRight = false;

  remainingEpisodesCount = computed(() => {
    const nextEpisode = this.nextEpisode();
    const nextEpisodeTrakt = Array.isArray(nextEpisode) ? nextEpisode[0] : nextEpisode;
    if (!this.showProgress() || !nextEpisodeTrakt || !this.tmdbSeason()) return -1;
    return getRemainingEpisodes(this.showProgress(), nextEpisodeTrakt, this.tmdbSeason());
  });
}

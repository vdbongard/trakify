import { Component, computed, input } from '@angular/core';
import { DecimalPipe, formatDate, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImagePrefixW185, ImagePrefixW300 } from '@constants';
import { getShowSlug } from '@helper/getShowSlug';
import { episodeTitle as toEpisodeTitle } from '@helper/episodeTitle';
import type { HistoryPlay } from '@type/Trakt';
import type { TmdbEpisode, TmdbShow } from '@type/Tmdb';

@Component({
  selector: 't-history-item',
  imports: [DecimalPipe, NgOptimizedImage, RouterLink],
  templateUrl: './history-item.component.html',
  styleUrl: './history-item.component.scss',
})
export class HistoryItemComponent {
  play = input.required<HistoryPlay>();
  tmdbShow = input<TmdbShow>();
  tmdbEpisode = input<TmdbEpisode | null>();
  back = input<string>();

  protected readonly ImagePrefixW185 = ImagePrefixW185;
  protected readonly ImagePrefixW300 = ImagePrefixW300;

  showName = computed(() => this.tmdbShow()?.name || this.play().show.title);
  episodeTitle = computed(() =>
    toEpisodeTitle(this.play().episode, this.play().episode.number, this.tmdbEpisode()),
  );
  stillPath = computed(() => this.tmdbEpisode()?.still_path);
  posterPath = computed(() => this.tmdbShow()?.poster_path);
  watchedAt = computed(() => formatDate(this.play().watched_at, 'HH:mm', 'en-US'));
  episodeLink = computed(() => {
    const { show, episode } = this.play();
    return `/shows/s/${getShowSlug(show)}/season/${episode.season}/episode/${episode.number}`;
  });
}

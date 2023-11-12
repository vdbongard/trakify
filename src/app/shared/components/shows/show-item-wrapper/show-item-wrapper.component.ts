import {
  booleanAttribute,
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import * as Paths from '@shared/paths';
import { HideRippleOnScrollDirective } from '@shared/directives/hide-ripple-on-scroll.directive';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { ShowItemComponent } from '@shared/components/shows/show-item/show-item.component';
import { RouterLink } from '@angular/router';
import { ShowInfo } from '@type/Show';
import { MatMenu } from '@angular/material/menu';
import { Show } from '@type/Trakt';
import { getShowSlug } from '@helper/getShowSlug';

@Component({
  selector: 't-show-item-wrapper',
  standalone: true,
  imports: [
    HideRippleOnScrollDirective,
    MatListModule,
    MatRippleModule,
    ShowItemComponent,
    RouterLink,
  ],
  templateUrl: './show-item-wrapper.component.html',
  styleUrl: './show-item-wrapper.component.scss',
})
export class ShowItemWrapperComponent {
  _showInfo = signal<ShowInfo>(getDefaultShowInfo());
  @Input({ required: true }) set showInfo(value: ShowInfo) {
    this._showInfo.set({ ...value });
  }
  @Input() back?: string;
  @Input() menu?: MatMenu;
  @Input() i?: number;
  @Input({ transform: booleanAttribute }) withLinkToEpisode?: boolean;
  @Input({ transform: booleanAttribute }) isLoggedIn?: boolean;
  @Input({ transform: booleanAttribute }) withYear?: boolean;
  @Input({ transform: booleanAttribute }) withEpisode?: boolean;
  @Input({ transform: booleanAttribute }) withAddButtons?: boolean;
  @Input({ transform: booleanAttribute }) withEpisodesCount?: boolean;
  @Input({ transform: booleanAttribute }) withProgressbar?: boolean;
  @Input({ transform: booleanAttribute }) withRelativeDate?: boolean;
  @Input({ transform: booleanAttribute }) withoutCustomProperty?: boolean;

  @Output() addFavorite = new EventEmitter<Show>();
  @Output() removeFavorite = new EventEmitter<Show>();
  @Output() add = new EventEmitter<Show>();
  @Output() remove = new EventEmitter<Show>();

  showSlug = computed(() => getShowSlug(this._showInfo().show));
  episodeLink = computed(() =>
    Paths.episode({
      show: this.showSlug(),
      season: this._showInfo().nextEpisode!.season + '',
      episode: this._showInfo().nextEpisode!.number + '',
    }),
  );
  showLink = computed(() => Paths.show({ show: this.showSlug() }));
}

export function getDefaultShowInfo(): ShowInfo {
  return {
    show: undefined,
    tmdbShow: undefined,
    tmdbSeason: undefined,
    showProgress: undefined,
    isFavorite: undefined,
    isHidden: undefined,
    isWatchlist: undefined,
    nextEpisode: undefined,
    nextEpisodeProgress: undefined,
    tmdbNextEpisode: undefined,
    showWatched: undefined,
  };
}

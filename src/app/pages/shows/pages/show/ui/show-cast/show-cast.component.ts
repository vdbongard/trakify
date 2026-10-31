import { Component, input, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Cast } from '@type/Tmdb';
import { ImagePrefixW185 } from '@constants';
import { TickerComponent } from '@shared/components/ticker/ticker.component';
import { getTraktSlug } from '@helper/getTraktSlug';

@Component({
  selector: 't-show-cast',
  imports: [NgOptimizedImage, TickerComponent],
  templateUrl: './show-cast.component.html',
  styleUrl: './show-cast.component.scss',
})
export class ShowCastComponent {
  cast = input<Cast[]>();
  traktPersonSlugs = input<Record<number, string>>({});
  failedProfileImages = signal<Set<string>>(new Set());

  posterPrefix = ImagePrefixW185;

  hasFailedProfileImage(castMember: Cast): boolean {
    return this.failedProfileImages().has(this.profileImageKey(castMember));
  }

  onProfileImageError(castMember: Cast): void {
    this.failedProfileImages.update((failedImages) =>
      new Set(failedImages).add(this.profileImageKey(castMember)),
    );
  }

  private profileImageKey(castMember: Cast): string {
    return `${castMember.id}:${castMember.profile_path}`;
  }

  getPersonUrl(tmdbId: number, name: string): string {
    const traktSlug = this.traktPersonSlugs()[tmdbId];
    return traktSlug
      ? `https://app.trakt.tv/people/${traktSlug}`
      : `https://www.themoviedb.org/person/${tmdbId}/${getTraktSlug(name)}`;
  }
}

import { Pipe, PipeTransform } from '@angular/core';

import type { Episode, Show } from '@type/interfaces/Trakt';

@Pipe({
  name: 'link',
})
export class LinkPipe implements PipeTransform {
  transform(
    show: Show | undefined,
    episode?: Episode | null,
    withLinkToEpisode = true
  ): string | null {
    if (!show) return null;
    return `/series/s/${show.ids.slug}${
      episode && withLinkToEpisode ? `/season/${episode.season}/episode/${episode.number}` : ''
    }`;
  }
}

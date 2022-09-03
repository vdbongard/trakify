import { Pipe, PipeTransform } from '@angular/core';
import { Episode, Show } from '../../../types/interfaces/Trakt';

@Pipe({
  name: 'episodeLink',
})
export class EpisodeLinkPipe implements PipeTransform {
  transform(episode: Episode | undefined, show: Show): string {
    if (!episode) throw Error('Episode is empty');
    return `/series/s/${show.ids.slug}/season/${episode.season}/episode/${episode.number}`;
  }
}

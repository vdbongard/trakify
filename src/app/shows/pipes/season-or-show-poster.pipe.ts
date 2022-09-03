import { Pipe, PipeTransform } from '@angular/core';
import { ShowInfo } from '../../../types/interfaces/Show';

@Pipe({
  name: 'seasonOrShowPoster',
})
export class SeasonOrShowPosterPipe implements PipeTransform {
  transform(showInfo: ShowInfo, posterPrefix: string): string | null {
    const seasonPoster = showInfo.showWatched && showInfo.tmdbSeason?.poster_path;
    const showPoster = showInfo.tmdbShow?.poster_path;

    return seasonPoster || showPoster ? posterPrefix + (seasonPoster || showPoster) : null;
  }
}

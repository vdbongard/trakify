import { Pipe, PipeTransform } from '@angular/core';
import { Params } from '@angular/router';

@Pipe({
  name: 'episodeLinkWithIndex',
})
export class EpisodeLinkWithIndexPipe implements PipeTransform {
  transform(params: Params, i: number): string {
    return '/series/s/' + params['slug'] + '/season/' + params['season'] + '/episode/' + (i + 1);
  }
}

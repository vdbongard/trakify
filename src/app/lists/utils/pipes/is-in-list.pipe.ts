import { Pipe, PipeTransform } from '@angular/core';

import type { ListItem } from '@type/interfaces/TraktList';

@Pipe({
  name: 'isInList',
})
export class IsInListPipe implements PipeTransform {
  transform(showId: number, listItems: ListItem[] | undefined): boolean {
    return !!listItems?.map((listItem) => listItem.show.ids.trakt).includes(showId);
  }
}

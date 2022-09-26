import { Pipe, PipeTransform } from '@angular/core';

import type { ListItem } from '@type/interfaces/TraktList';

@Pipe({
  name: 'isInList',
})
export class IsInListPipe implements PipeTransform {
  transform(showSlug: string, listItems: ListItem[] | undefined): boolean {
    return !!listItems?.map((listItem) => listItem.show.ids.slug).includes(showSlug);
  }
}

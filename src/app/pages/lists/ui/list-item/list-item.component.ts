import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { Show } from '@type/Trakt';
import { ListItem } from '@type/TraktList';
import { isInList } from '../list-items-dialog/list-items-dialog.component';

@Component({
  selector: 't-list-item',
  standalone: true,
  imports: [MatCheckboxModule],
  templateUrl: './list-item.component.html',
  styleUrl: './list-item.component.scss',
})
export class ListItemComponent {
  _show = signal<Show>(getDefaultShow());
  @Input() set show(value: Show) {
    this._show.set({ ...value });
  }
  _listItems = signal<ListItem[] | undefined>(undefined);
  @Input() set listItems(value: ListItem[] | undefined) {
    this._listItems.set([...(value ?? [])]);
  }

  @Output() listItemChange = new EventEmitter<MatCheckboxChange>();

  added: number[] = [];
  removed: number[] = [];

  isInList = computed(() => isInList(this._listItems(), this._show().ids.trakt));
}

export function getDefaultShow(): Show {
  return {
    ids: {
      imdb: '',
      slug: '',
      tmdb: 0,
      trakt: 0,
      tvdb: 0,
      tvrage: 0,
    },
    title: '',
    year: 0,
  };
}

import { Component, computed, EventEmitter, input, Output } from '@angular/core';
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
  show = input.required<Show>();
  listItems = input.required<ListItem[]>();

  @Output() listItemChange = new EventEmitter<MatCheckboxChange>();

  isInList = computed(() => isInList(this.listItems(), this.show().ids.trakt));

  added: number[] = [];
  removed: number[] = [];
}

import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { Show } from '@type/Trakt';
import { ListItem } from '@type/TraktList';
import { isInList } from '@helper/isInList';

@Component({
  selector: 't-list-item',
  standalone: true,
  imports: [MatCheckboxModule],
  templateUrl: './list-item.component.html',
  styleUrl: './list-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListItemComponent {
  show = input.required<Show>();
  listItems = input.required<ListItem[]>();

  listItemChange = output<MatCheckboxChange>();

  isInList = computed(() => isInList(this.listItems(), this.show().ids.trakt));
}

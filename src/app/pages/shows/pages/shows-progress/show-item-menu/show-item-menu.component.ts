import { Component, inject, input } from '@angular/core';
import { MatMenu, MatMenuItem } from '@angular/material/menu';
import { DialogService } from '@services/dialog.service';
import { ListService } from '../../../../lists/data/list.service';
import { ExecuteService } from '@services/execute.service';
import { ShowService } from '../../../data/show.service';
import { Show } from '@type/Trakt';

@Component({
  selector: 't-show-item-menu',
  templateUrl: './show-item-menu.component.html',
  styleUrl: './show-item-menu.component.scss',
  imports: [MatMenuItem],
})
export class ShowItemMenuComponent extends MatMenu {
  dialogService = inject(DialogService);
  listService = inject(ListService);
  executeService = inject(ExecuteService);
  showService = inject(ShowService);

  show = input.required<Show>();
  isFavorite = input.required<boolean>();
  isHidden = input.required<boolean>();
}

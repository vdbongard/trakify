import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';

import { ListsRoutingModule } from './lists-routing.module';
import { ListsComponent } from './components/lists/lists.component';
import { SharedModule } from '../shared/shared.module';
import { IsInListPipe } from './pipes/is-in-list.pipe';
import { ListItemsDialogComponent } from './components/list-items-dialog/list-items-dialog.component';

@NgModule({
  declarations: [ListsComponent, IsInListPipe, ListItemsDialogComponent],
  imports: [
    CommonModule,
    ListsRoutingModule,
    SharedModule,
    MatIconModule,
    MatTabsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
  ],
})
export class ListsModule {}

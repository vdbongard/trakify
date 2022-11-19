import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';

import { ListsRoutingModule } from './lists-routing.module';
import { ListsComponent } from './pages/lists/lists.component';
import { IsInListPipe } from './utils/pipes/is-in-list.pipe';
import { ListItemsDialogComponent } from './ui/list-items-dialog/list-items-dialog.component';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@NgModule({
  declarations: [ListsComponent, IsInListPipe, ListItemsDialogComponent],
  imports: [
    CommonModule,
    ListsRoutingModule,
    MatIconModule,
    MatTabsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    ShowsComponent,
    LoadingComponent,
  ],
})
export class ListsModule {}

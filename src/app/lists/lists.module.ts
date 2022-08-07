import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListsRoutingModule } from './lists-routing.module';
import { ListsComponent } from './components/lists/lists.component';
import { SharedModule } from '../shared/shared.module';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [ListsComponent],
  imports: [
    CommonModule,
    ListsRoutingModule,
    SharedModule,
    MatIconModule,
    MatTabsModule,
    MatButtonModule,
  ],
})
export class ListsModule {}

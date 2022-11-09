import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListsComponent } from './pages/lists/lists.component';

const routes: Routes = [{ path: '', component: ListsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ListsRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { StatisticsComponent } from './components/statistics/statistics.component';

const routes: Routes = [
  { path: '', component: StatisticsComponent, title: 'Statistics - Trakify' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StatisticsRoutingModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticsRoutingModule } from './statistics-routing.module';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { SharedModule } from '../shared/shared.module';
import { ShowsModule } from '../shows/shows.module';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@NgModule({
  declarations: [StatisticsComponent],
  imports: [CommonModule, StatisticsRoutingModule, SharedModule, ShowsModule, MatProgressBarModule],
})
export class StatisticsModule {}

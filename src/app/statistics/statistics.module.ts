import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { StatisticsRoutingModule } from './statistics-routing.module';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { ShowsModule } from '../shows/shows.module';
import { MinutesPipe } from '../shared/pipes/minutes.pipe';
import { LoadingComponent } from '../shared/components/loading/loading.component';

@NgModule({
  declarations: [StatisticsComponent],
  imports: [
    CommonModule,
    StatisticsRoutingModule,
    ShowsModule,
    MatProgressBarModule,
    MinutesPipe,
    LoadingComponent,
  ],
})
export class StatisticsModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { ShowsRoutingModule } from './shows-routing.module';

import { AddShowComponent } from './components/add-show/add-show.component';
import { SearchComponent } from './components/search/search.component';
import { UpcomingComponent } from './components/upcoming/upcoming.component';
import { WatchlistComponent } from './components/watchlist/watchlist.component';
import { ShowComponent } from './components/show/show/show.component';
import { ShowsComponent } from './components/shows/shows.component';
import { SeasonItemComponent } from './components/show/season-item/season-item.component';
import { SeasonComponent } from './components/season/season/season.component';
import { EpisodeItemComponent } from './components/season/episode-item/episode-item.component';
import { EpisodeComponent } from './components/episode/episode/episode.component';

import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { A11yModule } from '@angular/cdk/a11y';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { GetEpisodeNumberPipe } from './pipes/get-episode.pipe';
import { SeasonTitlePipe } from './pipes/season-title.pipe';
import { EpisodeTitlePipe } from './pipes/episode-title.pipe';
import { AirDatePipe } from './pipes/episode-air-date.pipe';

@NgModule({
  declarations: [
    ShowComponent,
    ShowsComponent,
    SeasonItemComponent,
    SeasonComponent,
    EpisodeItemComponent,
    EpisodeComponent,
    AddShowComponent,
    SearchComponent,
    UpcomingComponent,
    WatchlistComponent,
    GetEpisodeNumberPipe,
    SeasonTitlePipe,
    EpisodeTitlePipe,
    AirDatePipe,
  ],
  imports: [
    CommonModule,
    ShowsRoutingModule,
    SharedModule,
    FormsModule,
    MatProgressBarModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatRippleModule,
    MatIconModule,
    MatMenuModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatChipsModule,
    A11yModule,
  ],
})
export class ShowsModule {}

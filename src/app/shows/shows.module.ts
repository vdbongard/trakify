import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { ShowsRoutingModule } from './shows-routing.module';

import { ShowsWithSearchComponent } from './components/shows-with-search/shows-with-search.component';
import { SearchComponent } from './components/search/search.component';
import { UpcomingComponent } from './components/upcoming/upcoming.component';
import { WatchlistComponent } from './components/watchlist/watchlist.component';
import { ShowComponent } from './components/show/show/show.component';
import { ShowsProgressComponent } from './components/shows-progress/shows-progress.component';
import { ShowSeasonItemComponent } from './components/show/show-season-item/show-season-item.component';
import { SeasonComponent } from './components/season/season/season.component';
import { SeasonEpisodeItemComponent } from './components/season/season-episode-item/season-episode-item.component';
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
import { SeasonTitlePipe } from './pipes/season-title.pipe';
import { EpisodeTitlePipe } from './pipes/episode-title.pipe';
import { AirDatePipe } from './pipes/episode-air-date.pipe';
import { EpisodeTitleWithIndexPipe } from './pipes/episode-title-with-index.pipe';
import { ShowHeaderComponent } from './components/show/show-header/show-header.component';
import { ShowSeasonsComponent } from './components/show/show-seasons/show-seasons.component';
import { ShowNextEpisodeComponent } from './components/show/show-next-episode/show-next-episode.component';
import { SeasonHeaderComponent } from './components/season/season-header/season-header.component';
import { SeasonEpisodesComponent } from './components/season/season-episodes/season-episodes.component';
import { EpisodeHeaderComponent } from './components/episode/episode-header/episode-header.component';
import { ShowSubheadingPipe } from './pipes/show-subheading.pipe';
import { GetTrailerPipe } from '../shared/pipes/has-trailer.pipe';
import { NgGenericPipeModule } from 'ng-generic-pipe';
import { LoadingComponent } from '../shared/components/loading/loading.component';
import { ShowsComponent } from '../shared/components/shows/shows.component';
import { IsErrorPipe } from '../shared/pipes/is-error.pipe';
import { ShowSlugPipe } from '../shared/pipes/show-slug.pipe';
import { IsShowEndedPipe } from '../shared/pipes/is-show-ended.pipe';
import { EpisodeComponent as EpisodeComponentShared } from '../shared/components/episode/episode.component';
import { IsInFuturePipe } from '../shared/pipes/is-in-future.pipe';
import { SeasonLinkWithCounterPipe } from '../shared/pipes/season-link-with-counter.pipe';
import { BreadcrumbComponent } from '../shared/components/breadcrumb/breadcrumb.component';
import { EpisodeProgressPipe } from '../shared/pipes/episode-progress.pipe';
import { EpisodeLinkWithCounterPipe } from '../shared/pipes/episode-link-with-counter.pipe';
import { HideRippleOnScrollDirective } from '../shared/directives/hide-ripple-on-scroll.directive';
import { ShowLinksComponent } from './components/show/show-links/show-links.component';
import { ShowDetailsComponent } from './components/show/show-details/show-details.component';

@NgModule({
  declarations: [
    ShowComponent,
    ShowsProgressComponent,
    ShowSeasonItemComponent,
    SeasonComponent,
    SeasonEpisodeItemComponent,
    EpisodeComponent,
    ShowsWithSearchComponent,
    SearchComponent,
    UpcomingComponent,
    WatchlistComponent,
    SeasonTitlePipe,
    EpisodeTitlePipe,
    AirDatePipe,
    EpisodeTitleWithIndexPipe,
    ShowHeaderComponent,
    ShowSeasonsComponent,
    ShowNextEpisodeComponent,
    SeasonHeaderComponent,
    SeasonEpisodesComponent,
    EpisodeHeaderComponent,
  ],
  imports: [
    CommonModule,
    ShowsRoutingModule,
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
    NgOptimizedImage,
    ShowSubheadingPipe,
    GetTrailerPipe,
    NgGenericPipeModule,
    LoadingComponent,
    ShowsComponent,
    IsErrorPipe,
    ShowSlugPipe,
    IsShowEndedPipe,
    EpisodeComponentShared,
    IsInFuturePipe,
    SeasonLinkWithCounterPipe,
    BreadcrumbComponent,
    EpisodeProgressPipe,
    EpisodeLinkWithCounterPipe,
    HideRippleOnScrollDirective,
    ShowLinksComponent,
    ShowDetailsComponent,
  ],
})
export class ShowsModule {}

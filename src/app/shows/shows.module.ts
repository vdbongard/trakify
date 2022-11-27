import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { ShowsRoutingModule } from './shows-routing.module';

import { ShowsWithSearchComponent } from './pages/shows-with-search/shows-with-search.component';
import { SearchComponent } from './pages/search/search.component';
import { UpcomingComponent } from './pages/upcoming/upcoming.component';
import { WatchlistComponent } from './pages/watchlist/watchlist.component';
import { ShowComponent } from './pages/show/show.component';
import { ShowsProgressComponent } from './pages/shows-progress/shows-progress.component';
import { ShowSeasonItemComponent } from './ui/show-season-item/show-season-item.component';
import { SeasonComponent } from './pages/season/season.component';
import { SeasonEpisodeItemComponent } from './ui/season-episode-item/season-episode-item.component';
import { EpisodeComponent } from './pages/episode/episode.component';

import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
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
import { SeasonTitlePipe } from './utils/pipes/season-title.pipe';
import { EpisodeTitlePipe } from './utils/pipes/episode-title.pipe';
import { AirDatePipe } from './utils/pipes/episode-air-date.pipe';
import { EpisodeTitleWithIndexPipe } from './utils/pipes/episode-title-with-index.pipe';
import { ShowHeaderComponent } from './ui/show-header/show-header.component';
import { ShowSeasonsComponent } from './ui/show-seasons/show-seasons.component';
import { ShowNextEpisodeComponent } from './ui/show-next-episode/show-next-episode.component';
import { SeasonHeaderComponent } from './ui/season-header/season-header.component';
import { SeasonEpisodesComponent } from './ui/season-episodes/season-episodes.component';
import { EpisodeHeaderComponent } from './ui/episode-header/episode-header.component';
import { ShowSubheadingPipe } from './utils/pipes/show-subheading.pipe';
import { GetTrailerPipe } from '@shared/pipes/has-trailer.pipe';
import { NgGenericPipeModule } from 'ng-generic-pipe';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { IsErrorPipe } from '@shared/pipes/is-error.pipe';
import { ShowSlugPipe } from '@shared/pipes/show-slug.pipe';
import { IsShowEndedPipe } from '@shared/pipes/is-show-ended.pipe';
import { EpisodeComponent as EpisodeComponentShared } from '../shared/components/episode/episode.component';
import { IsInFuturePipe } from '@shared/pipes/is-in-future.pipe';
import { SeasonLinkWithCounterPipe } from '@shared/pipes/season-link-with-counter.pipe';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { EpisodeProgressPipe } from '@shared/pipes/episode-progress.pipe';
import { EpisodeLinkWithCounterPipe } from '@shared/pipes/episode-link-with-counter.pipe';
import { HideRippleOnScrollDirective } from '@shared/directives/hide-ripple-on-scroll.directive';
import { ShowLinksComponent } from './ui/show-links/show-links.component';
import { ShowDetailsComponent } from './ui/show-details/show-details.component';
import { ShowCastComponent } from './ui/show-cast/show-cast.component';

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
    ShowCastComponent,
  ],
})
export class ShowsModule {}

// todo remove remaining modules and transform to standalone api

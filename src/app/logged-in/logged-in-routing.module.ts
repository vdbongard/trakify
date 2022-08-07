import { RouterModule, Routes } from '@angular/router';
import { ShowsComponent } from './components/show/other/shows/shows/shows.component';
import { CanActivateLoggedIn } from '../auth-guard';
import { AddShowComponent } from './components/show/other/add-show/add-show.component';
import { SearchComponent } from './components/show/other/search/search.component';
import { UpcomingComponent } from './components/show/other/upcoming/upcoming.component';
import { WatchlistComponent } from './components/lists/watchlist/watchlist.component';
import { ShowComponent } from './components/show/show/show/show.component';
import { SeasonComponent } from './components/show/season/season/season.component';
import { EpisodeComponent } from './components/show/episode/episode/episode.component';
import { ListsComponent } from './components/lists/lists/lists.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { NgModule } from '@angular/core';

const routes: Routes = [
  { path: '', component: ShowsComponent },
  {
    path: 'add-series',
    component: AddShowComponent,
  },
  {
    path: 'search',
    component: SearchComponent,
  },
  {
    path: 'upcoming',
    component: UpcomingComponent,
  },
  {
    path: 'watchlist',
    component: WatchlistComponent,
  },
  { path: 's/:slug', component: ShowComponent },
  {
    path: 's/:slug/season/:season',
    component: SeasonComponent,
  },
  {
    path: 's/:slug/season/:season/episode/:episode',
    component: EpisodeComponent,
  },
  {
    path: 'lists',
    component: ListsComponent,
  },
  { path: 'statistics', component: StatisticsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [CanActivateLoggedIn],
})
export class LoggedInRoutingModule {}

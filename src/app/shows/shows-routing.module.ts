import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ShowsComponent } from './components/shows/shows.component';
import { AddShowComponent } from './components/add-show/add-show.component';
import { SearchComponent } from './components/search/search.component';
import { UpcomingComponent } from './components/upcoming/upcoming.component';
import { WatchlistComponent } from './components/watchlist/watchlist.component';
import { ShowComponent } from './components/show/show/show.component';
import { SeasonComponent } from './components/season/season/season.component';
import { EpisodeComponent } from './components/episode/episode/episode.component';
import { ShowsResolver } from './shows.resolver';
import { path } from '@helper/path';
import { addShow, episode, search, season, show, shows, upcoming, watchlist } from 'src/app/paths';

const routes: Routes = [
  {
    path: '',
    component: ShowsComponent,
    title: 'Shows - Trakify',
    resolve: { showInfos: ShowsResolver },
  },
  {
    path: path(addShow.pattern, shows.pattern),
    component: AddShowComponent,
    title: 'Add Show - Trakify',
  },
  {
    path: path(search.pattern, shows.pattern),
    component: SearchComponent,
    title: 'Search - Trakify',
  },
  {
    path: path(upcoming.pattern, shows.pattern),
    component: UpcomingComponent,
    title: 'Upcoming - Trakify',
  },
  {
    path: path(watchlist.pattern, shows.pattern),
    component: WatchlistComponent,
    title: 'Watchlist - Trakify',
  },
  { path: path(show.pattern, shows.pattern), component: ShowComponent, title: 'Show - Trakify' },
  {
    path: path(season.pattern, shows.pattern),
    component: SeasonComponent,
    title: 'Season - Trakify',
  },
  {
    path: path(episode.pattern, shows.pattern),
    component: EpisodeComponent,
    title: 'Episode - Trakify',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShowsRoutingModule {}

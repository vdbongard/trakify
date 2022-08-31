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

const routes: Routes = [
  { path: '', component: ShowsComponent, title: 'Shows - Trakify' },
  {
    path: 'add-series',
    component: AddShowComponent,
    title: 'Add Show - Trakify',
  },
  {
    path: 'search',
    component: SearchComponent,
    title: 'Search - Trakify',
  },
  {
    path: 'upcoming',
    component: UpcomingComponent,
    title: 'Upcoming - Trakify',
  },
  {
    path: 'watchlist',
    component: WatchlistComponent,
    title: 'Watchlist - Trakify',
  },
  { path: 's/:slug', component: ShowComponent, title: 'Trakify' },
  {
    path: 's/:slug/season/:season',
    component: SeasonComponent,
    title: 'Trakify',
  },
  {
    path: 's/:slug/season/:season/episode/:episode',
    component: EpisodeComponent,
    title: 'Trakify',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShowsRoutingModule {}

import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  Signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';
import type { ShowInfo } from '@type/Show';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { Show } from '@type/Trakt';

@Component({
  selector: 't-search',
  imports: [MatFormFieldModule, MatInputModule, FormsModule, A11yModule, ShowsComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export default class SearchComponent {
  showService = inject(ShowService);
  tmdbService = inject(TmdbService);
  router = inject(Router);

  q = input<string | undefined>();

  searchValue = linkedSignal(() => this.q());

  localShowSearchQuery = injectQuery(() => ({
    enabled: !!this.q(),
    queryKey: ['localShowSearch', this.q()],
    queryFn: (): Promise<Show[]> => lastValueFrom(this.showService.searchForAddedShows$(this.q()!)),
  }));

  tmdbShowQueries = this.tmdbService.getTmdbShowQueries(this.localShowSearchQuery.data);

  localShowSearchShowInfos: Signal<ShowInfo[]> = computed(
    () =>
      this.localShowSearchQuery.data()?.map((show) => ({
        show,
      })) ?? [],
  );

  showInfos = this.tmdbService.getShowsInfosWithTmdb(
    this.tmdbShowQueries,
    this.localShowSearchShowInfos,
  );

  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  constructor() {
    afterNextRender(() => {
      this.searchInput()?.nativeElement.focus?.();
    });
  }

  searchByNavigating(): void {
    this.router.navigate([], {
      queryParams: { q: this.searchValue() || null },
      replaceUrl: true,
    });
  }
}

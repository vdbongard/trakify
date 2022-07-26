import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, of } from 'rxjs';
import { SeasonProgress } from '../../../types/interfaces/Trakt';
import { ShowService } from './show.service';

@Injectable({
  providedIn: 'root',
})
export class SeasonService {
  constructor(private showService: ShowService) {}

  getSeasonProgress$(
    showId?: number,
    seasonNumber?: number
  ): Observable<SeasonProgress | undefined> {
    if (showId === undefined || seasonNumber === undefined) return of(undefined);

    const seasonProgress: Observable<SeasonProgress | undefined> =
      this.showService.showsProgress$.pipe(
        map((showsProgress) =>
          showsProgress[showId]?.seasons.find((season) => season.number === seasonNumber)
        )
      );
    const showAddedSeasonProgress = this.showService.addedShowInfos$.pipe(
      map((addedShowInfos) =>
        addedShowInfos[showId]?.showProgress?.seasons.find(
          (season) => season.number === seasonNumber
        )
      )
    );
    return combineLatest([seasonProgress, showAddedSeasonProgress]).pipe(
      map(([seasonProgress, showAddedSeasonProgress]) => seasonProgress || showAddedSeasonProgress)
    );
  }
}

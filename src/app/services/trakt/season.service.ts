import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, of } from 'rxjs';
import { Ids, SeasonProgress } from '../../../types/interfaces/Trakt';
import { ShowService } from './show.service';

@Injectable({
  providedIn: 'root',
})
export class SeasonService {
  constructor(private showService: ShowService) {}

  getSeasonProgress$(ids?: Ids, seasonNumber?: number): Observable<SeasonProgress | undefined> {
    if (ids === undefined || seasonNumber === undefined) return of(undefined);

    const seasonProgress: Observable<SeasonProgress | undefined> =
      this.showService.showsProgress$.pipe(
        map((showsProgress) =>
          showsProgress[ids.trakt]?.seasons.find((season) => season.number === seasonNumber)
        )
      );
    const showAddedSeasonProgress = this.showService.addedShowInfos$.pipe(
      map((addedShowInfos) =>
        addedShowInfos[ids.trakt]?.showProgress?.seasons.find(
          (season) => season.number === seasonNumber
        )
      )
    );
    return combineLatest([seasonProgress, showAddedSeasonProgress]).pipe(
      map(([seasonProgress, showAddedSeasonProgress]) => seasonProgress || showAddedSeasonProgress)
    );
  }
}

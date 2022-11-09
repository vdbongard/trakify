import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { InfoService } from '../data/info.service';
import { ShowInfo } from '@type/interfaces/Show';

@Injectable({
  providedIn: 'root',
})
export class ShowsResolver implements Resolve<ShowInfo[]> {
  constructor(private infoService: InfoService) {}

  resolve(): Observable<ShowInfo[]> {
    return this.infoService.getShowsFilteredAndSorted$();
  }
}

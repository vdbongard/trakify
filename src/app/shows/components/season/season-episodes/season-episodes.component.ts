import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoadingState } from '@type/enum';
import { EpisodeFull, SeasonProgress, Show } from '@type/interfaces/Trakt';
import * as Paths from 'src/app/paths';

@Component({
  selector: 't-season-episodes',
  templateUrl: './season-episodes.component.html',
  styleUrls: ['./season-episodes.component.scss'],
})
export class SeasonEpisodesComponent implements OnChanges {
  @Input() show?: Show | null;
  @Input() seasonNumber?: string | null;
  @Input() seasonProgress?: SeasonProgress | null;
  @Input() episodes?: EpisodeFull[] | null;

  @Output() addEpisode = new EventEmitter();
  @Output() removeEpisode = new EventEmitter();

  episodesLoadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  paths = Paths;

  ngOnChanges(): void {
    if (this.episodes && this.episodesLoadingState.value === LoadingState.LOADING)
      this.episodesLoadingState.next(LoadingState.SUCCESS);
  }
}

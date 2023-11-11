import { Component, computed, EventEmitter, Input, Output, signal, Signal } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import type { EpisodeFull } from '@type/Trakt';
import { SeasonProgress } from '@type/Trakt';
import { DatePipe } from '@angular/common';

@Component({
  selector: 't-season-episode-item',
  standalone: true,
  imports: [MatCheckboxModule, DatePipe],
  templateUrl: './season-episode-item.component.html',
  styleUrl: './season-episode-item.component.scss',
})
export class SeasonEpisodeItemComponent {
  _i = signal(0);
  @Input() set i(value: number) {
    this._i.set(value);
  }

  @Input({ required: true }) seasonProgress!: Signal<SeasonProgress | null | undefined>;
  _episode = signal<EpisodeFull | undefined>(undefined);
  @Input() set episode(value: EpisodeFull) {
    this._episode.set({ ...value });
  }

  @Input() isLoggedIn?: boolean | null;

  @Output() add = new EventEmitter<EpisodeFull>();
  @Output() remove = new EventEmitter<EpisodeFull>();

  currentDate = new Date();

  episodeProgress = computed(() => {
    if (!this.seasonProgress() || !this._episode()) return;
    return this.seasonProgress()?.episodes.find((episodeProgress) => {
      return episodeProgress.number === this._episode()!.number;
    });
  });

  episodeAirDate = computed(() => {
    return new Date(this._episode()?.first_aired + '');
  });

  episodeTitle = computed(() => {
    const episode = this._episode();
    const i = this._i();
    return episode?.title && episode?.number !== undefined
      ? episode.title + ' (' + episode.number + ')'
      : 'Episode ' + ((episode?.number ?? i) + 1);
  });

  onClick(event: Event): void {
    event.stopPropagation();
    this.episodeProgress()?.completed
      ? this.remove.emit(this._episode())
      : this.add.emit(this._episode());
  }
}

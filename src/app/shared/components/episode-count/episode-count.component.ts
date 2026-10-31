import { booleanAttribute, Component, computed, input } from '@angular/core';
import type { ShowProgressSummary } from '@type/ShowProgress';

@Component({
  selector: 't-episode-count',
  standalone: true,
  templateUrl: './episode-count.component.html',
  styleUrl: './episode-count.component.scss',
})
export class EpisodeCountComponent {
  progress = input<ShowProgressSummary>();
  episodes = input<number>();
  withDividerLeft = input(false, { transform: booleanAttribute });
  withDividerRight = input(false, { transform: booleanAttribute });

  remainingEpisodesCount = computed(() => this.progress()?.remaining);

  protected readonly Divider = '·';
}

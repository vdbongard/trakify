import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigService } from '@services/config.service';
import { episodeUrlTarget } from '@helper/history';
import { HistoryService } from '../../data/history.service';

/**
 * Warms the History ahead of a navigation arriving back from an Episode page.
 *
 * The row the reader followed has to be rendered — and named for the view transition — when the
 * browser captures the new view of that transition, which happens in this page's first pass. After
 * a reload nothing the History rendered from is cached any more, so the Plays are not there in time
 * and the still has nothing to morph into. A resolver runs before the router starts the transition,
 * which is the last point the Plays can be put in place.
 *
 * Only a return from an Episode is worth it: that is the one arrival with a still to morph out of.
 * Every other way in is better off showing its own loading state than holding the view it came from.
 */
export async function historyReturn(): Promise<void> {
  const url = inject(Router).currentNavigation()?.previousNavigation?.finalUrl?.toString();
  if (!url || !episodeUrlTarget(url)) return;

  await inject(HistoryService).warmFirstPage(inject(ConfigService).config.s().language);
}

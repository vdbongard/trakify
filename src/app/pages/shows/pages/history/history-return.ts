import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigService } from '@services/config.service';
import { episodeUrlTarget } from '@helper/episodeUrl';
import { HistoryService } from '../../data/history.service';

export async function historyReturn(): Promise<void> {
  const url = inject(Router).currentNavigation()?.previousNavigation?.finalUrl?.toString();
  if (!url || !episodeUrlTarget(url)) return;

  await inject(HistoryService).warmFirstPage(inject(ConfigService).config.s().language);
}

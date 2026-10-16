import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ConfigService } from '@services/config.service';
import { HistoryService } from '../../data/history.service';
import { historyReturn } from './history-return';

/** Only `toString` is read off the URL the router reports, so a plain stand-in is enough. */
function url(value: string): { toString: () => string } {
  return { toString: () => value };
}

describe('historyReturn resolver', () => {
  let warmFirstPage: ReturnType<typeof vi.fn>;
  let currentNavigation: unknown;

  beforeEach(() => {
    warmFirstPage = vi.fn(() => Promise.resolve());
    currentNavigation = null;

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { currentNavigation: (): unknown => currentNavigation } },
        { provide: HistoryService, useValue: { warmFirstPage } },
        {
          provide: ConfigService,
          useValue: { config: { s: (): { language: string } => ({ language: 'en-US' }) } },
        },
      ],
    });
  });

  it('warms the History for a navigation coming back from an Episode', async () => {
    currentNavigation = { previousNavigation: { finalUrl: url('/shows/s/bb/season/1/episode/1') } };

    await TestBed.runInInjectionContext(() => historyReturn());

    expect(warmFirstPage).toHaveBeenCalledWith('en-US');
  });

  it('leaves the History alone when the navigation came from anywhere else', async () => {
    currentNavigation = { previousNavigation: { finalUrl: url('/shows/watchlist') } };

    await TestBed.runInInjectionContext(() => historyReturn());

    expect(warmFirstPage).not.toHaveBeenCalled();
  });

  it('leaves the History alone on the first navigation, which came from nothing', async () => {
    await TestBed.runInInjectionContext(() => historyReturn());

    expect(warmFirstPage).not.toHaveBeenCalled();
  });
});

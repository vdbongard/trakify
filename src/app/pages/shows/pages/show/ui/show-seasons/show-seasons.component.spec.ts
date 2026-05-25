import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowSeasonsComponent } from './show-seasons.component';
import { mockShow } from '@shared/mocks/mockShow';
import { mockTmdbShowSeason } from '@shared/mocks/mockTmdbShowSeason';
import { provideRouter } from '@angular/router';
import type { TmdbShow } from '@type/Tmdb';

describe('ShowSeasonsComponent', () => {
  let fixture: ComponentFixture<ShowSeasonsComponent>;

  const baseTmdbShow = {
    seasons: [
      { ...mockTmdbShowSeason, season_number: 1, name: 'Season 1' },
      { ...mockTmdbShowSeason, id: 54321, season_number: 2, name: 'Season 2', episode_count: 8 },
    ],
  } as unknown as TmdbShow;

  function createComponent(overrides?: {
    tmdbShow?: TmdbShow;
    show?: typeof mockShow;
  }): void {
    fixture = TestBed.createComponent(ShowSeasonsComponent);
    if (overrides?.tmdbShow !== undefined) {
      fixture.componentRef.setInput('tmdbShow', overrides.tmdbShow);
    }
    if (overrides?.show !== undefined) {
      fixture.componentRef.setInput('show', overrides.show);
    }
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not render season list when tmdbShow is undefined', () => {
    createComponent();
    const links = fixture.nativeElement.querySelectorAll('a.season-link');
    expect(links.length).toBe(0);
  });

  it('should render season links for each season', () => {
    createComponent({ tmdbShow: baseTmdbShow, show: mockShow });
    const links = fixture.nativeElement.querySelectorAll('a.season-link');
    expect(links.length).toBe(2);
    expect(links[0].getAttribute('href')).toBe('/shows/s/test-show/season/1');
    expect(links[1].getAttribute('href')).toBe('/shows/s/test-show/season/2');
  });

  it('should render show-season-item for each season', () => {
    createComponent({ tmdbShow: baseTmdbShow });
    const items = fixture.nativeElement.querySelectorAll('t-show-season-item');
    expect(items.length).toBe(2);
  });
});

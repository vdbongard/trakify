import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowListItemWrapperComponent } from './show-list-item-wrapper.component';
import { mockShowInfo } from '@shared/mocks/mockShowInfo';
import { mockShow } from '@shared/mocks/mockShow';
import { provideRouter } from '@angular/router';
import type { ShowInfo } from '@type/Show';
import type { EpisodeFull } from '@type/Trakt';

describe('ShowListItemWrapperComponent', () => {
  let fixture: ComponentFixture<ShowListItemWrapperComponent>;

  function createComponent(overrides?: { showInfo?: ShowInfo; withLinkToEpisode?: boolean }): void {
    fixture = TestBed.createComponent(ShowListItemWrapperComponent);
    fixture.componentRef.setInput('showInfo', overrides?.showInfo ?? mockShowInfo);
    if (overrides?.withLinkToEpisode !== undefined) {
      fixture.componentRef.setInput('withLinkToEpisode', overrides.withLinkToEpisode);
    }
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
  });

  it('should create', () => {
    createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render link to show page', () => {
    createComponent();
    const link = fixture.nativeElement.querySelector('a');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/shows/s/test-show');
  });

  it('should render link to episode when withLinkToEpisode and nextEpisode are set', () => {
    const showInfo: ShowInfo = {
      show: mockShow,
      nextEpisode: { season: 2, number: 8, title: 'Ep 8', ids: { trakt: 1, tmdb: 1, tvdb: 1, tvrage: 1 }, first_aired: null } as unknown as EpisodeFull,
    };
    createComponent({ showInfo, withLinkToEpisode: true });
    const link = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('/shows/s/test-show/season/2/episode/8');
  });

  it('should render show-list-item child component', () => {
    createComponent();
    const child = fixture.nativeElement.querySelector('t-show-list-item');
    expect(child).toBeTruthy();
  });
});

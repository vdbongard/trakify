import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowLinksComponent } from './show-links.component';
import { Show } from '@type/Trakt';
import { TmdbShow } from '@type/Tmdb';

describe('ShowLinksComponent', () => {
  let fixture: ComponentFixture<ShowLinksComponent>;

  const showWithAllIds = {
    title: 'Test Show',
    year: 2023,
    ids: {
      trakt: 1,
      slug: 'test-show',
      tmdb: 123,
      imdb: 'tt1234567',
      tvdb: 456,
    },
  } as Show;

  const showWithMinimalIds = {
    title: 'Test Show',
    year: 2023,
    ids: {
      trakt: 1,
      slug: 'test-show',
    },
  } as Show;

  const tmdbShowWithAll = {
    homepage: 'https://example.com',
    external_ids: {
      twitter_id: 'testtwitter',
      instagram_id: 'testinstagram',
      facebook_id: 'testfacebook',
    },
  } as TmdbShow;

  function createComponent(show?: Show, tmdbShow?: TmdbShow): void {
    fixture = TestBed.createComponent(ShowLinksComponent);
    if (show !== undefined) {
      fixture.componentRef.setInput('show', show);
    }
    if (tmdbShow !== undefined) {
      fixture.componentRef.setInput('tmdbShow', tmdbShow);
    }
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowLinksComponent],
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show no links when no inputs provided', () => {
    createComponent();
    expect(fixture.nativeElement.querySelectorAll('a').length).toBe(0);
  });

  it('should show show-id-based links when show has all IDs', () => {
    createComponent(showWithAllIds);

    const links = fixture.nativeElement.querySelectorAll('a');
    expect(links.length).toBe(4);
    expect(links[0].textContent).toBe('Trakt');
    expect(links[0].href).toBe('https://trakt.tv/shows/test-show');
    expect(links[1].textContent).toBe('TMDB');
    expect(links[1].href).toBe('https://www.themoviedb.org/tv/123');
    expect(links[2].textContent).toBe('IMDB');
    expect(links[2].href).toBe('https://imdb.com/title/tt1234567');
    expect(links[3].textContent).toBe('TVDB');
    expect(links[3].href).toBe('https://www.thetvdb.com/dereferrer/series/456');
  });

  it('should show social links when tmdbShow has external IDs', () => {
    createComponent(undefined, tmdbShowWithAll);

    const links = fixture.nativeElement.querySelectorAll('a');
    expect(links.length).toBe(4);
    expect(links[0].textContent.trim()).toBe('Website');
    expect(links[0].href).toBe('https://example.com/');
    expect(links[1].textContent.trim()).toBe('Twitter');
    expect(links[1].href).toBe('https://www.twitter.com/testtwitter');
    expect(links[2].textContent.trim()).toBe('Instagram');
    expect(links[2].href).toBe('https://www.instagram.com/testinstagram');
    expect(links[3].textContent.trim()).toBe('Facebook');
    expect(links[3].href).toBe('https://www.facebook.com/testfacebook');
  });

  it('should show all available links when all inputs provided', () => {
    createComponent(showWithAllIds, tmdbShowWithAll);

    const links = fixture.nativeElement.querySelectorAll('a');
    expect(links.length).toBe(8);
    expect(links[0].textContent.trim()).toBe('Website');
    expect(links[1].textContent.trim()).toBe('Trakt');
    expect(links[2].textContent.trim()).toBe('TMDB');
    expect(links[3].textContent.trim()).toBe('IMDB');
    expect(links[4].textContent.trim()).toBe('TVDB');
    expect(links[5].textContent.trim()).toBe('Twitter');
    expect(links[6].textContent.trim()).toBe('Instagram');
    expect(links[7].textContent.trim()).toBe('Facebook');
  });

  it('should not show links for missing IDs', () => {
    createComponent(showWithMinimalIds);

    const links = fixture.nativeElement.querySelectorAll('a');
    expect(links.length).toBe(1);
    expect(links[0].textContent.trim()).toBe('Trakt');
  });
});

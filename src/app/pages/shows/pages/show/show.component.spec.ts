import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import ShowComponent from './show.component';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { EMPTY, of } from 'rxjs';
import { mockShow } from '@shared/mocks/mockShow';
import type { Episode } from '@type/Trakt';

describe('ShowComponent', () => {
  let component: ShowComponent;
  let fixture: ComponentFixture<ShowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({
              show: 'test-show',
            }),
          },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideOAuthClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render show page sections', () => {
    const rootLoading = fixture.nativeElement.querySelector('t-loading');
    const header = fixture.nativeElement.querySelector('t-show-header');
    const cast = fixture.nativeElement.querySelector('t-show-cast');
    const details = fixture.nativeElement.querySelector('t-show-details');
    const nextEpisode = fixture.nativeElement.querySelector('t-show-next-episode');
    const seasons = fixture.nativeElement.querySelector('t-show-seasons');
    const links = fixture.nativeElement.querySelector('t-show-links');

    expect(rootLoading).toBeTruthy();
    expect(header).toBeTruthy();
    expect(cast).toBeTruthy();
    expect(details).toBeTruthy();
    expect(nextEpisode).toBeTruthy();
    expect(seasons).toBeTruthy();
    expect(links).toBeTruthy();
  });

  describe('methods', () => {
    it('throws when addToHistory episode is missing', async () => {
      const methodComponent = Object.create(ShowComponent.prototype) as ShowComponent;

      await expect(methodComponent.addToHistory(undefined, mockShow)).rejects.toThrow(
        'Episode is empty (addToHistory)',
      );
    });

    it('calls execute service when adding episode to history', async () => {
      const methodComponent = Object.create(ShowComponent.prototype) as ShowComponent;
      methodComponent.executeService = {
        addEpisode: vi.fn(() => Promise.resolve(undefined)),
      } as never;

      const episode: Episode = {
        ids: {
          trakt: 1,
          tmdb: 1,
          tvdb: 1,
          tvrage: 1,
          imdb: 'tt1',
        },
        season: 1,
        number: 1,
        title: 'Episode 1',
      };

      await methodComponent.addToHistory(episode, mockShow);

      expect(methodComponent.executeService.addEpisode).toHaveBeenCalledWith(episode, mockShow);
    });

    it('handles addToHistory errors and marks seen loading as error', async () => {
      const methodComponent = Object.create(ShowComponent.prototype) as ShowComponent;
      methodComponent.executeService = {
        addEpisode: vi.fn(() => Promise.reject(new Error('failed to add'))),
      } as never;
      methodComponent.seenLoading = signal<'success' | 'error'>('success') as never;
      methodComponent.snackBar = {
        open: vi.fn(() => ({
          onAction: (): typeof EMPTY => EMPTY,
        })),
      } as never;

      const episode: Episode = {
        ids: {
          trakt: 1,
          tmdb: 1,
          tvdb: 1,
          tvrage: 1,
          imdb: 'tt1',
        },
        season: 1,
        number: 1,
        title: 'Episode 1',
      };

      await methodComponent.addToHistory(episode, mockShow);

      expect(methodComponent.seenLoading()).toBe('error');
      expect(methodComponent.snackBar.open).toHaveBeenCalled();
    });

    it('destroys lightbox and clears active show on destroy', () => {
      const methodComponent = Object.create(ShowComponent.prototype) as ShowComponent;
      const destroy = vi.fn();
      const activeShowSet = vi.fn();

      methodComponent.lightbox = { destroy } as never;
      methodComponent.showService = {
        activeShow: { set: activeShowSet },
      } as never;

      methodComponent.ngOnDestroy();

      expect(destroy).toHaveBeenCalled();
      expect(activeShowSet).toHaveBeenCalledWith(undefined);
    });
  });
});

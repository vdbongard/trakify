import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';
import { SyncService } from '@services/sync.service';
import { Theme } from '@type/Enum';
import type { Config } from '@type/Config';
import type { State } from '@type/State';
import { mockSwUpdateProvider } from '@shared/mocks/mockSwUpdate';

describe('HeaderComponent', () => {
  @Component({ template: '', standalone: true })
  class DummyComponent {}

  async function createComponent(
    isLoggedIn: boolean,
    url?: string,
  ): Promise<ComponentFixture<HeaderComponent>> {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: DummyComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        mockSwUpdateProvider,
        provideOAuthClient(),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.componentRef.setInput('isLoggedIn', isLoggedIn);
    fixture.detectChanges();

    if (url) {
      const router = TestBed.inject(Router);
      await router.navigateByUrl(url);
      fixture.detectChanges();
    }

    return fixture;
  }

  function createConfig(): Config {
    return {
      filters: [
        { category: 'hide', name: 'No new episodes', value: false },
        { category: 'show', name: 'No new episodes', value: false },
      ],
      sort: { values: ['Newest episode'], by: 'Newest episode' },
      sortOptions: [{ name: 'Favorites first', value: false }],
      upcomingFilters: [
        { category: 'hide', name: 'Watchlist items', value: false },
        { category: 'show', name: 'Watchlist items', value: false },
      ],
      theme: Theme.SYSTEM,
      language: 'en-US',
      lastFetchedAt: {
        sync: null,
        progress: null,
        episodes: null,
        showProgress: {},
      },
    } as Config;
  }

  describe('when not logged in', () => {
    it('should create', async () => {
      const fixture = await createComponent(false);
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render logo with Trakify text', async () => {
      const fixture = await createComponent(false);
      const logo = fixture.nativeElement.querySelector('[data-test-id="logo"]');
      expect(logo).toBeTruthy();
      expect(logo.textContent.trim()).toBe('Trakify');
    });

    it('should not render back button when no state', async () => {
      const fixture = await createComponent(false);
      const back = fixture.nativeElement.querySelector('.back-link');
      expect(back).toBeNull();
    });

    it('should not render sync spinner when not syncing', async () => {
      const fixture = await createComponent(false);
      const spinner = fixture.nativeElement.querySelector('.sync-spinner');
      expect(spinner).toBeNull();
    });

    it('should not render filter button when not logged in', async () => {
      const fixture = await createComponent(false);
      const filter = fixture.nativeElement.querySelector('[aria-label="Filter icon"]');
      expect(filter).toBeNull();
    });

    it('should not render sort button when not logged in', async () => {
      const fixture = await createComponent(false);
      const sort = fixture.nativeElement.querySelector('[aria-label="Sort icon"]');
      expect(sort).toBeNull();
    });

    it('should not render search button when not logged in', async () => {
      const fixture = await createComponent(false);
      const search = fixture.nativeElement.querySelector('[aria-label="Search icon"]');
      expect(search).toBeNull();
    });

    it('should render menu trigger button', async () => {
      const fixture = await createComponent(false);
      const menu = fixture.nativeElement.querySelector('[data-test-id="topbar-menu"]');
      expect(menu).toBeTruthy();
    });
  });

  describe('when logged in', () => {
    it('should render search button', async () => {
      const fixture = await createComponent(true);
      const search = fixture.nativeElement.querySelector('a[aria-label="Search icon"]');
      expect(search).toBeTruthy();
      expect(search.getAttribute('routerLink')).toBe('/shows/search');
    });

    it('should render filter and sort buttons on /shows/progress', async () => {
      const fixture = await createComponent(true, '/shows/progress');
      const filter = fixture.nativeElement.querySelector('[aria-label="Filter icon"]');
      expect(filter).toBeTruthy();
      const sort = fixture.nativeElement.querySelector('[aria-label="Sort icon"]');
      expect(sort).toBeTruthy();
    });

    it('should not render filter button on root URL', async () => {
      const fixture = await createComponent(true, '/');
      const filter = fixture.nativeElement.querySelector('[aria-label="Filter icon"]');
      expect(filter).toBeNull();
    });

    it('should not render sort button on /shows/upcoming', async () => {
      const fixture = await createComponent(true, '/shows/upcoming');
      const sort = fixture.nativeElement.querySelector('[aria-label="Sort icon"]');
      expect(sort).toBeNull();
    });

    it('should render add list button on /lists', async () => {
      const fixture = await createComponent(true, '/lists');
      const addList = fixture.nativeElement.querySelector('[data-test-id="add-list-button"]');
      expect(addList).toBeTruthy();
    });

    it('should render filter button on /shows/upcoming', async () => {
      const fixture = await createComponent(true, '/shows/upcoming');
      const filter = fixture.nativeElement.querySelector('[aria-label="Filter icon"]');
      expect(filter).toBeTruthy();
    });

    it('should render six mat-menu elements (filter, sort, default, theme, language, sync)', async () => {
      const fixture = await createComponent(true, '/shows/progress');
      const menus = fixture.nativeElement.querySelectorAll('mat-menu');
      expect(menus.length).toBe(6);
    });

    it('renders remove list button only when lists exist on /lists', async () => {
      const fixture = await createComponent(true, '/lists');
      const component = fixture.componentInstance;

      component.listService.lists.s.set([]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-test-id="remove-list-button"]')).toBeNull();

      component.listService.lists.s.set([
        {
          ids: { trakt: 1, slug: 'list-1' },
          allow_comments: true,
          comment_count: 0,
          created_at: '2020-01-01T00:00:00.000Z',
          description: null,
          display_numbers: false,
          item_count: 0,
          likes: 0,
          name: 'List 1',
          privacy: 'public',
          sort_by: 'rank',
          sort_how: 'asc',
          type: 'personal',
          updated_at: '2020-01-01T00:00:00.000Z',
          user: {
            ids: { slug: 'user' },
            name: 'User',
            private: false,
            username: 'user',
            vip: false,
            vip_ep: false,
          },
        },
      ] as never);
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('[data-test-id="remove-list-button"]'),
      ).toBeTruthy();
    });
  });

  describe('component methods and computed state', () => {
    it('goBack navigates only when url is provided', async () => {
      const fixture = await createComponent(true);
      const component = fixture.componentInstance;
      const navigateSpy = vi.spyOn(component.router, 'navigateByUrl');

      await component.goBack(undefined);
      expect(navigateSpy).not.toHaveBeenCalled();

      await component.goBack('/shows/progress');
      expect(navigateSpy).toHaveBeenCalledWith('/shows/progress');
    });

    it('onFilterChange disables opposite-category active filter and syncs config', async () => {
      const fixture = await createComponent(true);
      const component = fixture.componentInstance;

      const config = createConfig();
      config.filters[0].value = true;
      config.filters[1].value = true;

      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const syncSpy = vi.spyOn(component.configService.config, 'sync');
      component.onFilterChange(config.filters[0]);

      expect(config.filters[1].value).toBe(false);
      expect(syncSpy).toHaveBeenCalled();
    });

    it('onFilterChange exits when config input missing', async () => {
      const fixture = await createComponent(true);
      const component = fixture.componentInstance;
      const syncSpy = vi.spyOn(component.configService.config, 'sync');

      component.onFilterChange({ category: 'hide', name: 'No new episodes', value: true } as never);

      expect(syncSpy).not.toHaveBeenCalled();
    });

    it('onShare calls navigator.share and handles errors', async () => {
      const fixture = await createComponent(true);
      const component = fixture.componentInstance;

      const shareSpy = vi
        .spyOn(navigator, 'share')
        .mockImplementation(() => Promise.resolve() as never);
      await component.onShare();
      expect(shareSpy).toHaveBeenCalled();

      shareSpy.mockImplementation(() => Promise.reject(new Error('share failed')) as never);
      const openSpy = vi.spyOn(component.snackBar, 'open');
      await component.onShare();
      expect(openSpy).toHaveBeenCalled();
    });

    it('getQueryParams returns parsed slug query param', async () => {
      const fixture = await createComponent(true, '/lists?slug=my-list');
      const component = fixture.componentInstance;

      expect(component.getQueryParams()).toEqual({ slug: 'my-list' });
    });

    it('computed helpers react to url, state and active show', async () => {
      const fixture = await createComponent(true);
      const component = fixture.componentInstance;

      const config = createConfig();
      fixture.componentRef.setInput('config', config);
      fixture.componentRef.setInput('state', { back: '/shows/progress' } as State);

      component.showService.activeShow.set({
        ids: {
          trakt: 1,
          slug: 'show-1',
          tmdb: 1,
          tvdb: 1,
          tvrage: 1,
          imdb: 'tt1',
        },
        title: 'Show 1',
        year: 2023,
      });

      const isFavoriteSpy = vi.spyOn(component.showService, 'isFavorite').mockReturnValue(true);
      const isHiddenSpy = vi.spyOn(component.showService, 'isHidden').mockReturnValue(true);

      await component.router.navigateByUrl('/shows/s/show-1/season/1');
      fixture.detectChanges();

      expect(component.hasFilter()).toBe(false);
      expect(component.hasSort()).toBe(false);
      expect(component.isShow()).toBe(true);
      expect(component.isSeason()).toBe(true);
      expect(component.isFavoriteShow()).toBe(true);
      expect(component.isHiddenShow()).toBe(true);
      expect(isFavoriteSpy).toHaveBeenCalled();
      expect(isHiddenSpy).toHaveBeenCalled();

      await component.router.navigateByUrl('/shows/progress');
      fixture.detectChanges();
      expect(component.hasFilter()).toBe(true);
      expect(component.hasSort()).toBe(true);

      await component.router.navigateByUrl('/lists');
      fixture.detectChanges();
      expect(component.isList()).toBe(true);
    });

    it('shows sync spinner when sync service reports syncing', async () => {
      const fixture = await createComponent(true);
      const component = fixture.componentInstance;

      (component.syncService as SyncService).isSyncing.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.sync-spinner')).toBeNull();

      (component.syncService as SyncService).isSyncing.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.sync-spinner')).toBeTruthy();
    });
  });
});

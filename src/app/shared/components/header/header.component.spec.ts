import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { provideServiceWorker } from '@angular/service-worker';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';

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
        provideServiceWorker('ngsw-worker.js'),
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
      expect(back).toBeFalsy();
    });

    it('should not render sync spinner when not syncing', async () => {
      const fixture = await createComponent(false);
      const spinner = fixture.nativeElement.querySelector('.sync-spinner');
      expect(spinner).toBeFalsy();
    });

    it('should not render filter button when not logged in', async () => {
      const fixture = await createComponent(false);
      const filter = fixture.nativeElement.querySelector('[aria-label="Filter icon"]');
      expect(filter).toBeFalsy();
    });

    it('should not render sort button when not logged in', async () => {
      const fixture = await createComponent(false);
      const sort = fixture.nativeElement.querySelector('[aria-label="Sort icon"]');
      expect(sort).toBeFalsy();
    });

    it('should not render search button when not logged in', async () => {
      const fixture = await createComponent(false);
      const search = fixture.nativeElement.querySelector('[aria-label="Search icon"]');
      expect(search).toBeFalsy();
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
      expect(filter).toBeFalsy();
    });

    it('should not render sort button on /shows/upcoming', async () => {
      const fixture = await createComponent(true, '/shows/upcoming');
      const sort = fixture.nativeElement.querySelector('[aria-label="Sort icon"]');
      expect(sort).toBeFalsy();
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
  });
});

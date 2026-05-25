import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowItemMenuComponent } from './show-item-menu.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { mockShow } from '@shared/mocks/mockShow';

describe('ShowItemMenuComponent', () => {
  async function setup(
    isFavorite: boolean,
    isHidden: boolean,
  ): Promise<ComponentFixture<ShowItemMenuComponent>> {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideOAuthClient()],
    }).compileComponents();

    const fixture = TestBed.createComponent(ShowItemMenuComponent);
    fixture.componentRef.setInput('show', mockShow);
    fixture.componentRef.setInput('isFavorite', isFavorite);
    fixture.componentRef.setInput('isHidden', isHidden);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', async () => {
    const fixture = await setup(false, false);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show Mark as seen and Remove show', async () => {
    const fixture = await setup(false, false);
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('button[mat-menu-item]');
    const texts = Array.from(buttons).map((b) => b.textContent.trim());
    expect(texts).toContain('Mark as seen');
    expect(texts).toContain('Remove show');
  });

  it('should show Add favorite when not favorite', async () => {
    const fixture = await setup(false, false);
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('button[mat-menu-item]');
    const texts = Array.from(buttons).map((b) => b.textContent.trim());
    expect(texts).toContain('Add favorite');
    expect(texts).not.toContain('Remove favorite');
  });

  it('should show Remove favorite when favorite', async () => {
    const fixture = await setup(true, false);
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('button[mat-menu-item]');
    const texts = Array.from(buttons).map((b) => b.textContent.trim());
    expect(texts).toContain('Remove favorite');
    expect(texts).not.toContain('Add favorite');
  });

  it('should show Hide show when not hidden', async () => {
    const fixture = await setup(false, false);
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('button[mat-menu-item]');
    const texts = Array.from(buttons).map((b) => b.textContent.trim());
    expect(texts).toContain('Hide show');
    expect(texts).not.toContain('Unhide show');
  });

  it('should show Unhide show when hidden', async () => {
    const fixture = await setup(false, true);
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('button[mat-menu-item]');
    const texts = Array.from(buttons).map((b) => b.textContent.trim());
    expect(texts).toContain('Unhide show');
    expect(texts).not.toContain('Hide show');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ShowsComponent } from './shows.component';
import { ShowListItemWrapperComponent } from './show-list-item-wrapper/show-list-item-wrapper.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { mockShow } from '@shared/mocks/mockShow';
import type { ShowInfo } from '@type/Show';

const mockShowInfo: ShowInfo = {
  show: mockShow,
};

function wrappers(fixture: ComponentFixture<ShowsComponent>): ShowListItemWrapperComponent[] {
  return fixture.debugElement
    .queryAll(By.directive(ShowListItemWrapperComponent))
    .map((debugElement) => debugElement.componentInstance as ShowListItemWrapperComponent);
}

describe('ShowsComponent', () => {
  let fixture: ComponentFixture<ShowsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowsComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not render list when showsInfos is undefined', () => {
    const list = fixture.nativeElement.querySelector('mat-list');
    expect(list).toBeFalsy();
  });

  it('should render show wrapper for each showInfo', () => {
    fixture.componentRef.setInput('showsInfos', [mockShowInfo, mockShowInfo]);
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('mat-list');
    const items = fixture.nativeElement.querySelectorAll('t-show-list-item-wrapper');

    expect(list).toBeTruthy();
    expect(items.length).toBe(2);
  });

  it('should render an empty state when showsInfos is an empty list', () => {
    fixture.componentRef.setInput('showsInfos', []);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('t-show-list-item-wrapper');
    const emptyState = fixture.nativeElement.querySelector('.empty-state');

    expect(items.length).toBe(0);
    expect(emptyState.querySelector('p').textContent.trim()).toBe('No shows to display.');
  });

  it('can leave the empty state to the page when it is one of several lists', () => {
    fixture.componentRef.setInput('showsInfos', []);
    fixture.componentRef.setInput('showEmptyState', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty-state')).toBeFalsy();
  });

  it('numbers rows from its place in the page, so preloading spans the page not the list', () => {
    fixture.componentRef.setInput('showsInfos', [mockShowInfo, mockShowInfo, mockShowInfo]);
    fixture.componentRef.setInput('offset', 10);
    fixture.detectChanges();

    expect(wrappers(fixture).map((wrapper) => wrapper.i())).toEqual([10, 11, 12]);
  });

  it('passes the eagerly-loaded first page flag down to its rows', () => {
    fixture.componentRef.setInput('showsInfos', [mockShowInfo]);
    fixture.componentRef.setInput('withEagerImages', true);
    fixture.detectChanges();

    expect(wrappers(fixture)[0].withEagerImage()).toBe(true);
  });
});

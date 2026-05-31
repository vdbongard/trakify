import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowsComponent } from './shows.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { mockShow } from '@shared/mocks/mockShow';
import type { ShowInfo } from '@type/Show';

const mockShowInfo: ShowInfo = {
  show: mockShow,
};

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

  it('should not render wrappers when showsInfos is an empty list', () => {
    fixture.componentRef.setInput('showsInfos', []);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('t-show-list-item-wrapper');
    expect(items.length).toBe(0);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowListItemWrapperComponent } from './show-list-item-wrapper.component';
import { mockShowInfo } from '@shared/mocks/mockShowInfo';
import { provideRouter } from '@angular/router';

describe('ShowListItemWrapperComponent', () => {
  let component: ShowListItemWrapperComponent;
  let fixture: ComponentFixture<ShowListItemWrapperComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(ShowListItemWrapperComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('showInfo', mockShowInfo);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

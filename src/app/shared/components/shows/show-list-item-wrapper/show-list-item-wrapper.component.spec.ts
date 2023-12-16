import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowListItemWrapperComponent } from './show-list-item-wrapper.component';

describe('ShowListItemWrapperComponent', () => {
  let component: ShowListItemWrapperComponent;
  let fixture: ComponentFixture<ShowListItemWrapperComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ShowListItemWrapperComponent],
    });
    fixture = TestBed.createComponent(ShowListItemWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

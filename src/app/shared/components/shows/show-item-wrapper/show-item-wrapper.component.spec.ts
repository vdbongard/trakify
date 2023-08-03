import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowItemWrapperComponent } from './show-item-wrapper.component';

describe('ShowItemWrapperComponent', () => {
  let component: ShowItemWrapperComponent;
  let fixture: ComponentFixture<ShowItemWrapperComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ShowItemWrapperComponent],
    });
    fixture = TestBed.createComponent(ShowItemWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

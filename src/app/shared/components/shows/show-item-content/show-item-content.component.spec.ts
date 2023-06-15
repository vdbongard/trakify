import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowItemContentComponent } from './show-item-content.component';

describe('ShowItemContentComponent', () => {
  let component: ShowItemContentComponent;
  let fixture: ComponentFixture<ShowItemContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowItemContentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowItemContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

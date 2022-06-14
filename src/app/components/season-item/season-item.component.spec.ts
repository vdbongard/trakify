import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonItemComponent } from './season-item.component';

describe('SeasonItemComponent', () => {
  let component: SeasonItemComponent;
  let fixture: ComponentFixture<SeasonItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SeasonItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SeasonItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonHeaderComponent } from './season-header.component';

describe('SeasonHeaderComponent', () => {
  let component: SeasonHeaderComponent;
  let fixture: ComponentFixture<SeasonHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SeasonHeaderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeasonHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

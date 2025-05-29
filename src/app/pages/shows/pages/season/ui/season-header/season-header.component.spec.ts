import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonHeaderComponent } from './season-header.component';
import { provideRouter } from '@angular/router';

describe('SeasonHeaderComponent', () => {
  let component: SeasonHeaderComponent;
  let fixture: ComponentFixture<SeasonHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SeasonHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

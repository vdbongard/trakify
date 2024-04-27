import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowSeasonsComponent } from './show-seasons.component';

describe('ShowSeasonsComponent', () => {
  let component: ShowSeasonsComponent;
  let fixture: ComponentFixture<ShowSeasonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShowSeasonsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowSeasonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

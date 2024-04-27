import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowSeasonItemComponent } from './show-season-item.component';

describe('ShowSeasonItemComponent', () => {
  let component: ShowSeasonItemComponent;
  let fixture: ComponentFixture<ShowSeasonItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShowSeasonItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowSeasonItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

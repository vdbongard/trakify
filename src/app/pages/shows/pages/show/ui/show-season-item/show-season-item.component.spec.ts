import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowSeasonItemComponent } from './show-season-item.component';
import { mockTmdbShowSeason } from '@shared/mocks/mockTmdbShowSeason';

describe('ShowSeasonItemComponent', () => {
  let component: ShowSeasonItemComponent;
  let fixture: ComponentFixture<ShowSeasonItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();

    fixture = TestBed.createComponent(ShowSeasonItemComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('season', mockTmdbShowSeason);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

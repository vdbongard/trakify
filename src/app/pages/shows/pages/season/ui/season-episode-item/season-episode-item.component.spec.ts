import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonEpisodeItemComponent } from './season-episode-item.component';

describe('EpisodeItemComponent', () => {
  let component: SeasonEpisodeItemComponent;
  let fixture: ComponentFixture<SeasonEpisodeItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SeasonEpisodeItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SeasonEpisodeItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowNextEpisodeComponent } from './show-next-episode.component';

describe('ShowNextEpisodeComponent', () => {
  let component: ShowNextEpisodeComponent;
  let fixture: ComponentFixture<ShowNextEpisodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShowNextEpisodeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowNextEpisodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

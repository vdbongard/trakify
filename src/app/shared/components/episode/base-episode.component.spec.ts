import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseEpisodeComponent } from './base-episode.component';

describe('EpisodeComponent', () => {
  let component: BaseEpisodeComponent;
  let fixture: ComponentFixture<BaseEpisodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BaseEpisodeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseEpisodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

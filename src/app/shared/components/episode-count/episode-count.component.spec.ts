import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { EpisodeCountComponent } from './episode-count.component';

describe('EpisodeCountComponent', () => {
  let component: EpisodeCountComponent;
  let fixture: ComponentFixture<EpisodeCountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeCountComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

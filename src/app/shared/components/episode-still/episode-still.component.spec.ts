import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { EpisodeStillComponent } from './episode-still.component';

describe('EpisodeStillComponent', () => {
  let component: EpisodeStillComponent;
  let fixture: ComponentFixture<EpisodeStillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeStillComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeStillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpisodeHeaderComponent } from './episode-header.component';

describe('EpisodeHeaderComponent', () => {
  let component: EpisodeHeaderComponent;
  let fixture: ComponentFixture<EpisodeHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EpisodeHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

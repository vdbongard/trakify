import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpisodeHeaderComponent } from './episode-header.component';
import { provideRouter } from '@angular/router';

describe('EpisodeHeaderComponent', () => {
  let component: EpisodeHeaderComponent;
  let fixture: ComponentFixture<EpisodeHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeHeaderComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('episodeNumber', '1');
    fixture.componentRef.setInput('seasonNumber', '1');
    fixture.componentRef.setInput('showSlug', 'test-show');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

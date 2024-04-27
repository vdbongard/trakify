import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoDialogComponent } from './video-dialog.component';

describe('VideoDialogComponent', () => {
  let component: VideoDialogComponent;
  let fixture: ComponentFixture<VideoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

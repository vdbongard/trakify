import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoDialogComponent } from './video-dialog.component';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VideoDialogData } from '@type/Dialog';
import { mockVideo } from '@shared/mocks/mockVideo';

describe('VideoDialogComponent', () => {
  let component: VideoDialogComponent;
  let fixture: ComponentFixture<VideoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            video: mockVideo,
          } as VideoDialogData,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { ConfirmDialogData } from '@type/Dialog';
import { vi } from 'vitest';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let nativeElement: HTMLElement;
  let dialogRefSpy: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRefSpy = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        {
          provide: MatDialogRef,
          useValue: dialogRefSpy,
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: 'Delete Item',
            message: 'Are you sure you want to delete this item permanently?',
            confirmButton: 'Delete Now',
          } as ConfirmDialogData,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render dialog data (title, message, button label) correctly', () => {
    const titleEl = nativeElement.querySelector('h1[mat-dialog-title]');
    expect(titleEl?.textContent?.trim()).toBe('Delete Item');

    const contentEl = nativeElement.querySelector('div[mat-dialog-content]');
    expect(contentEl?.textContent?.trim()).toBe(
      'Are you sure you want to delete this item permanently?',
    );

    const confirmButton = nativeElement.querySelector('button[data-test-id="confirm-button"]');
    expect(confirmButton?.textContent?.trim()).toBe('Delete Now');
  });

  it('should close dialog with false when Cancel button is clicked', () => {
    const cancelButton = nativeElement.querySelector<HTMLButtonElement>(
      'button:not([data-test-id])',
    );
    expect(cancelButton).toBeTruthy();
    cancelButton?.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });

  it('should close dialog with true when Confirm button is clicked', () => {
    const confirmButton = nativeElement.querySelector<HTMLButtonElement>(
      'button[data-test-id="confirm-button"]',
    );
    expect(confirmButton).toBeTruthy();
    confirmButton?.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });
});

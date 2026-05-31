import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddListDialogComponent } from './add-list-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { vi } from 'vitest';

describe('AddListDialogComponent', () => {
  let fixture: ComponentFixture<AddListDialogComponent>;
  let nativeElement: HTMLElement;
  let dialogRefSpy: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRefSpy = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AddListDialogComponent],
      providers: [
        {
          provide: MatDialogRef,
          useValue: dialogRefSpy,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddListDialogComponent);
    nativeElement = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialize with an empty name', () => {
    const inputElement = nativeElement.querySelector<HTMLInputElement>(
      'input[data-test-id="add-list"]',
    );
    expect(inputElement).toBeTruthy();
    expect(inputElement?.value).toBe('');
  });

  it('should not close the dialog when Create is clicked and name is empty', () => {
    const createButton = nativeElement.querySelector<HTMLButtonElement>(
      'mat-dialog-actions button:last-child',
    );
    expect(createButton).toBeTruthy();

    createButton?.click();

    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('should close the dialog with payload when Create is clicked and name is set', async () => {
    const inputElement = nativeElement.querySelector<HTMLInputElement>('input[type="text"]');
    expect(inputElement).toBeTruthy();
    if (inputElement) {
      inputElement.value = 'My Watchlist';
      inputElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
    }

    const createButton = nativeElement.querySelector<HTMLButtonElement>(
      'mat-dialog-actions button:last-child',
    );
    expect(createButton).toBeTruthy();
    createButton?.click();

    expect(dialogRefSpy.close).toHaveBeenCalledWith({ name: 'My Watchlist' });
  });

  it('should close the dialog with no payload when Cancel button is clicked', () => {
    const cancelButton = nativeElement.querySelector<HTMLButtonElement>(
      'mat-dialog-actions button:first-child',
    );
    expect(cancelButton).toBeTruthy();
    cancelButton?.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  it('should close the dialog with payload when Create button is clicked with non-empty name', async () => {
    const inputElement = nativeElement.querySelector<HTMLInputElement>('input[type="text"]');
    expect(inputElement).toBeTruthy();
    if (inputElement) {
      inputElement.value = 'New Show List';
      inputElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
    }

    const createButton = nativeElement.querySelector<HTMLButtonElement>(
      'mat-dialog-actions button:last-child',
    );
    expect(createButton).toBeTruthy();
    createButton?.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ name: 'New Show List' });
  });

  it('should close the dialog when valid form is submitted', async () => {
    const inputElement = nativeElement.querySelector<HTMLInputElement>('input[type="text"]');
    expect(inputElement).toBeTruthy();
    if (inputElement) {
      inputElement.value = 'Form Submitted List';
      inputElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
    }

    const formElement = nativeElement.querySelector<HTMLFormElement>('form');
    expect(formElement).toBeTruthy();
    formElement?.dispatchEvent(new Event('submit'));
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ name: 'Form Submitted List' });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddListDialogComponent } from './add-list-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { vi } from 'vitest';

describe('AddListDialogComponent', () => {
  let component: AddListDialogComponent;
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
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with an empty name', () => {
    expect(component.name()).toBe('');
  });

  it('should not close the dialog or create list if name is empty', () => {
    component.name.set('');
    component.createList();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('should close the dialog with the name payload when createList is called with a non-empty name', () => {
    component.name.set('My Watchlist');
    component.createList();
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

  it('should close the dialog with payload when Create button is clicked with non-empty name', () => {
    component.name.set('New Show List');
    fixture.detectChanges();

    const createButton = nativeElement.querySelector<HTMLButtonElement>(
      'mat-dialog-actions button:last-child',
    );
    expect(createButton).toBeTruthy();
    createButton?.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ name: 'New Show List' });
  });

  it('should update the name signal when the input value changes', async () => {
    const inputElement = nativeElement.querySelector<HTMLInputElement>('input[type="text"]');
    expect(inputElement).toBeTruthy();
    if (inputElement) {
      inputElement.value = 'Custom User List';
      inputElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.name()).toBe('Custom User List');
    }
  });

  it('should call createList when the form is submitted', () => {
    const createListSpy = vi.spyOn(component, 'createList');
    const formElement = nativeElement.querySelector<HTMLFormElement>('form');
    expect(formElement).toBeTruthy();
    formElement?.dispatchEvent(new Event('submit'));
    expect(createListSpy).toHaveBeenCalled();
  });
});

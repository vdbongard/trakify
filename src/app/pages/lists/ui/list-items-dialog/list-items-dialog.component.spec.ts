import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListItemsDialogComponent } from './list-items-dialog.component';
import type { ListItemsDialogData } from '@type/Dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { mockListItems } from '@shared/mocks/mockListItems';
import { mockShow } from '@shared/mocks/mockShow';
import { mockList } from '@shared/mocks/mockList';
import { vi } from 'vitest';

describe('ListItemsDialogComponent', () => {
  let fixture: ComponentFixture<ListItemsDialogComponent>;
  let dialogRefSpy: { close: ReturnType<typeof vi.fn> };

  async function createComponent(listItems: ListItemsDialogData['listItems']): Promise<void> {
    dialogRefSpy = { close: vi.fn() };

    await TestBed.configureTestingModule({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            listItems,
            list: mockList,
            shows: [mockShow],
          } as ListItemsDialogData,
        },
        {
          provide: MatDialogRef,
          useValue: dialogRefSpy,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListItemsDialogComponent);
    fixture.detectChanges();
  }

  it('should create', async () => {
    await createComponent(mockListItems);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render list items for each show', async () => {
    await createComponent(mockListItems);
    const items = fixture.nativeElement.querySelectorAll('t-list-item');
    expect(items.length).toBe(1);
  });

  it('should close dialog on cancel', async () => {
    await createComponent(mockListItems);
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    const cancelButton = Array.from(buttons).find((b) => b.textContent?.trim() === 'Cancel');
    cancelButton?.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  it('should close dialog with added/removed on apply', async () => {
    await createComponent(mockListItems);
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    const okButton = Array.from(buttons).find((b) => b.textContent?.trim() === 'Ok');
    okButton?.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ added: [], removed: [] });
  });

  it('should track removed show when unchecking', async () => {
    await createComponent(mockListItems);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const checkbox = await loader.getHarness(MatCheckboxHarness);
    await checkbox.uncheck();

    const okButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.trim() === 'Ok');
    okButton?.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ added: [], removed: [123456] });
  });

  it('should track added show when checking a new show', async () => {
    await createComponent([]);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const checkbox = await loader.getHarness(MatCheckboxHarness);
    await checkbox.check();

    const okButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.trim() === 'Ok');
    okButton?.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ added: [123456], removed: [] });
  });
});

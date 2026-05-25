import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListDialogComponent } from './list-dialog.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { ListsDialogData } from '@type/Dialog';
import { List } from '@type/TraktList';

describe('ListDialogComponent', () => {
  let fixture: ComponentFixture<ListDialogComponent>;
  let dialogRefSpy: { close: ReturnType<typeof vi.fn> };

  async function createComponent(overrides?: { listIds?: number[] }): Promise<void> {
    dialogRefSpy = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: [
        {
          provide: MatDialogRef,
          useValue: dialogRefSpy,
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            lists: [
              { name: 'Watchlist', ids: { trakt: 1 } } as List,
              { name: 'Favorites', ids: { trakt: 2 } } as List,
              { name: 'Completed', ids: { trakt: 3 } } as List,
            ],
            listIds: overrides?.listIds ?? [1, 2, 3],
            showId: 12345,
          } as ListsDialogData,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListDialogComponent);
    fixture.detectChanges();
  }

  it('should create', async () => {
    await createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render list names', async () => {
    await createComponent();
    const items = fixture.nativeElement.querySelectorAll('mat-checkbox');
    expect(items.length).toBe(3);
    expect(items[0].textContent.trim()).toBe('Watchlist');
    expect(items[1].textContent.trim()).toBe('Favorites');
    expect(items[2].textContent.trim()).toBe('Completed');
  });

  it('should close dialog on cancel', async () => {
    await createComponent();
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    const cancelButton = Array.from(buttons).find((b) => b.textContent?.trim() === 'Cancel');
    cancelButton?.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  it('should close dialog with added/removed on apply', async () => {
    await createComponent();
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    const okButton = Array.from(buttons).find((b) => b.textContent?.trim() === 'Ok');
    okButton?.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ added: [], removed: [] });
  });

  it('should track removed list when unchecking', async () => {
    await createComponent();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);
    await checkboxes[0].uncheck();

    const okButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.trim() === 'Ok');
    okButton?.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ added: [], removed: [1] });
  });

  it('should track added list when checking a new list', async () => {
    await createComponent({ listIds: [] });
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const checkbox = await loader.getHarness(MatCheckboxHarness);
    await checkbox.check();

    const okButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.trim() === 'Ok');
    okButton?.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ added: [1], removed: [] });
  });
});

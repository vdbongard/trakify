import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { ListItemComponent } from './list-item.component';
import { mockShow } from '@shared/mocks/mockShow';
import { mockListItems } from '@shared/mocks/mockListItems';
import type { ListItem } from '@type/TraktList';

describe('ListItemComponent', () => {
  let fixture: ComponentFixture<ListItemComponent>;

  function createComponent(overrides?: { listItems?: ListItem[] }): void {
    fixture = TestBed.createComponent(ListItemComponent);
    fixture.componentRef.setInput('show', mockShow);
    fixture.componentRef.setInput('listItems', overrides?.listItems ?? mockListItems);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ListItemComponent],
    });
  });

  it('should create', () => {
    createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render show title and year', () => {
    createComponent();
    const checkbox = fixture.nativeElement.querySelector('mat-checkbox');
    expect(checkbox.textContent.trim()).toBe('Test Show (2023)');
  });

  it('should check checkbox when show is in list', async () => {
    createComponent();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const checkbox = await loader.getHarness(MatCheckboxHarness);
    expect(await checkbox.isChecked()).toBe(true);
  });

  it('should not check checkbox when show is not in list', async () => {
    createComponent({ listItems: [] });
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const checkbox = await loader.getHarness(MatCheckboxHarness);
    expect(await checkbox.isChecked()).toBe(false);
  });
});

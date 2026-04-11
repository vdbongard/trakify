import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingComponent } from './loading.component';
import { Component } from '@angular/core';
import { vi } from 'vitest';
import { LoadingState } from '@type/Loading';

describe('LoadingComponent', () => {
  let fixture: ComponentFixture<LoadingComponent>;
  let component: LoadingComponent;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({}).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(LoadingComponent);
    component = fixture.componentInstance;
  }

  it('should show content when state is success', () => {
    createComponent();
    fixture.componentRef.setInput('loadingState', 'success');
    fixture.detectChanges();
    expect(component.spinnerVisible()).toBe(false);
  });

  it('should show error template when state is error and showErrorTemplate is true', () => {
    createComponent();
    fixture.componentRef.setInput('loadingState', 'error');
    fixture.componentRef.setInput('showErrorTemplate', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('An error occurred.');
  });

  it('should show custom error template when provided', () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.state = 'error';
    hostFixture.componentInstance.showError = true;
    hostFixture.detectChanges();

    expect(hostFixture.nativeElement.textContent).toContain('Custom Error');
  });

  it('should show loading spinner after delay when loading', () => {
    createComponent();
    fixture.componentRef.setInput('loadingState', 'loading');
    fixture.detectChanges();

    // Initial
    expect(component.spinnerVisible()).toBe(false);

    // Advance less than loadingDelay
    vi.advanceTimersByTime(500);
    fixture.detectChanges();
    expect(component.spinnerVisible()).toBe(false);

    // Advance to loadingDelay
    vi.advanceTimersByTime(300); // 500 + 300 = 800ms
    fixture.detectChanges();
    expect(component.spinnerVisible()).toBe(true);
  });

  it('should remain visible for at least minimumLoadingShown duration even if loading finishes early', () => {
    createComponent();
    fixture.componentRef.setInput('loadingState', 'loading');
    fixture.detectChanges();

    // Advance timers past loadingDelay to ensure spinner shows
    vi.advanceTimersByTime(800);
    fixture.detectChanges();
    expect(component.spinnerVisible()).toBe(true);

    // Loading finishes early
    fixture.componentRef.setInput('loadingState', 'success');
    fixture.detectChanges();

    // Spinner should remain true until minimumLoadingShown has passed since the state changed to 'success'
    // Advance time by less than minimumLoadingShown
    vi.advanceTimersByTime(300); // Total time elapsed since 'loading' start: 800 + 300 = 1100ms
    fixture.detectChanges();
    expect(component.spinnerVisible()).toBe(true); // Should still be true

    // Advance remaining time to meet minimumLoadingShown
    vi.advanceTimersByTime(300); // Total time elapsed since 'loading' start: 1100 + 300 = 1400ms
    fixture.detectChanges();
    expect(component.spinnerVisible()).toBe(false); // Should now be false
  });
});

@Component({
  selector: 't-test-host',
  template: `
    <ng-template #customLoading>Custom Loading</ng-template>
    <ng-template #customError>Custom Error</ng-template>
    <t-loading
      [loadingState]="state"
      [customLoading]="customLoading"
      [customError]="customError"
      [showErrorTemplate]="showError"
    />
  `,
  imports: [LoadingComponent],
})
class TestHostComponent {
  state: LoadingState = 'loading';
  showError = false;
}

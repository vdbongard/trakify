import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpinnerComponent } from './spinner.component';
import { vi } from 'vitest';

describe('SpinnerComponent', () => {
  let fixture: ComponentFixture<SpinnerComponent>;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [SpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpinnerComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render mat-spinner', () => {
    vi.advanceTimersByTime(800);
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('mat-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should render in loading wrapper', () => {
    vi.advanceTimersByTime(800);
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.loading-wrapper');
    expect(wrapper).toBeTruthy();
    expect(wrapper.querySelector('mat-spinner')).toBeTruthy();
  });

  it('should not render spinner before loadingDelay', () => {
    vi.advanceTimersByTime(799);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeFalsy();
  });

  it('should respect custom loadingDelay input', () => {
    fixture.componentRef.setInput('loadingDelay', 200);
    fixture.detectChanges();
    vi.advanceTimersByTime(199);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeFalsy();
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeTruthy();
  });
});

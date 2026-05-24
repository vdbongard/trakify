import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorText } from './error-text.component';

describe('ErrorText', () => {
  let component: ErrorText;
  let fixture: ComponentFixture<ErrorText>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorText],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorText);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('error', Error('Test error message'));
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the error message', async () => {
    fixture.componentRef.setInput('error', Error('Something went wrong'));

    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Something went wrong');
  });

  it('should render an object error as json when it has no message', async () => {
    fixture.componentRef.setInput('error', { code: 'unknown_error' } as unknown as Error);

    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('"code": "unknown_error"');
  });

  it('should render a primitive error value', async () => {
    fixture.componentRef.setInput('error', 'Something failed' as unknown as Error);

    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Something failed');
  });
});

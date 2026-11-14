import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';

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

    expect(fixture.nativeElement.textContent).toBe('Something went wrong');
  });

  it('should render an object error as json when it has no message', async () => {
    fixture.componentRef.setInput('error', { code: 'unknown_error' } as unknown as Error);

    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toBe(`{
  "code": "unknown_error"
}`);
  });

  it('should render the message of a plain object error', async () => {
    fixture.componentRef.setInput('error', { message: 'Plain failure' } as unknown as Error);

    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toBe('Plain failure');
  });

  it('should render an HTTP failure as a message a reader can act on', async () => {
    fixture.componentRef.setInput(
      'error',
      new HttpErrorResponse({ status: 0, url: 'https://api.trakt.tv/shows/avatar' }),
    );

    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('p')?.textContent).toBe(
      'Could not reach the server. Check your connection and try again.',
    );
  });

  it('should allow long unbroken error messages to wrap', async () => {
    const message = `https://api.trakt.tv/${'x'.repeat(120)}`;
    fixture.componentRef.setInput('error', Error(message));

    await fixture.whenStable();

    const paragraph = fixture.nativeElement.querySelector('p');
    expect(paragraph.textContent).toBe(message);
    expect(getComputedStyle(paragraph).overflowWrap).toBe('anywhere');
  });

  it('should render a primitive error value', async () => {
    fixture.componentRef.setInput('error', 'Something failed' as unknown as Error);

    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toBe('Something failed');
  });

  it('should only render the Retry button when asked, and emit on click', async () => {
    expect(fixture.nativeElement.querySelector('button')).toBeNull();

    const retry = vi.fn();
    component.retry.subscribe(retry);
    fixture.componentRef.setInput('showRetry', true);
    await fixture.whenStable();

    const button: HTMLButtonElement | null = fixture.nativeElement.querySelector('button');
    expect(button?.textContent?.trim()).toBe('Retry');

    button?.click();

    expect(retry).toHaveBeenCalled();
  });
});

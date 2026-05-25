import { ComponentFixture, TestBed } from '@angular/core/testing';
import AboutComponent from './about.component';

describe('AboutComponent', () => {
  let fixture: ComponentFixture<AboutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render heading', () => {
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading.textContent.trim()).toBe('About');
  });

  it('should render donate button with PayPal link', () => {
    const donate = fixture.nativeElement.querySelector('.donate-button') as HTMLAnchorElement;
    expect(donate).toBeTruthy();
    expect(donate.textContent.trim()).toBe('Donate');
    expect(donate.href).toBe('https://www.paypal.com/donate/?hosted_button_id=NZVDE9956NGDN');
  });

  it('should render external link to source code', () => {
    const links: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('a');
    const githubLink = Array.from(links).find((a) => a.textContent?.trim() === 'GitHub');
    expect(githubLink).toBeTruthy();
    expect(githubLink!.href).toBe('https://github.com/vdbongard/trakify');
  });
});

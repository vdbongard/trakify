import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreadcrumbComponent } from './breadcrumb.component';
import { provideRouter } from '@angular/router';

describe('BreadcrumbComponent', () => {
  let component: BreadcrumbComponent;
  let fixture: ComponentFixture<BreadcrumbComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render empty state placeholder when parts is empty', async () => {
    fixture.componentRef.setInput('parts', []);
    fixture.detectChanges();
    await fixture.whenStable();

    const links = nativeElement.querySelectorAll('a.part');
    expect(links.length).toBe(0);

    const emptySpan = nativeElement.querySelector('span.part');
    expect(emptySpan).toBeTruthy();
    expect(emptySpan?.textContent?.trim()).toBe('');
  });

  it('should render single part and no dividers when parts has one item', async () => {
    fixture.componentRef.setInput('parts', [{ name: 'Single Page', link: '/single' }]);
    fixture.detectChanges();
    await fixture.whenStable();

    const links = nativeElement.querySelectorAll('a.part');
    expect(links.length).toBe(1);
    expect(links[0].textContent?.trim()).toBe('Single Page');
    expect(links[0].getAttribute('href')).toBe('/single');

    const dividers = nativeElement.querySelectorAll('.divider');
    expect(dividers.length).toBe(0);

    // Host binding class 'ticker' should be applied to the first (and index 0) element
    expect(links[0].classList.contains('ticker')).toBe(true);
  });

  it('should render multiple parts and dividers correctly', async () => {
    fixture.componentRef.setInput('parts', [
      { name: 'Home', link: '/' },
      { name: 'Shows', link: '/shows' },
      { name: 'Breaking Bad', link: '/shows/breaking-bad' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const links = nativeElement.querySelectorAll('a.part');
    expect(links.length).toBe(3);

    expect(links[0].textContent?.trim()).toBe('Home');
    expect(links[0].getAttribute('href')).toBe('/');
    expect(links[0].classList.contains('ticker')).toBe(true); // Index 0 gets tickerIf=true

    expect(links[1].textContent?.trim()).toBe('Shows');
    expect(links[1].getAttribute('href')).toBe('/shows');
    expect(links[1].classList.contains('ticker')).toBe(false); // Index 1 gets tickerIf=false

    expect(links[2].textContent?.trim()).toBe('Breaking Bad');
    expect(links[2].getAttribute('href')).toBe('/shows/breaking-bad');
    expect(links[2].classList.contains('ticker')).toBe(false); // Index 2 gets tickerIf=false

    const dividers = nativeElement.querySelectorAll('.divider');
    expect(dividers.length).toBe(2);
    expect(dividers[0].textContent?.trim()).toBe('/');
    expect(dividers[1].textContent?.trim()).toBe('/');
  });
});

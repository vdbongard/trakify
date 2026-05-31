import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavComponent } from './nav.component';
import { provideRouter } from '@angular/router';
import type { Link } from '@type/Router';

describe('NavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show sidenav links when logged in', async () => {
    fixture.componentRef.setInput('isLoggedIn', true);

    await fixture.whenStable();

    const links = sidenavLinks();
    expect(sidenavLinkLabels()).toEqual(['Shows', 'Lists', 'Statistics']);
    expect(links[0].getAttribute('href')).toBe('/shows');
    expect(links[1].getAttribute('href')).toBe('/lists');
    expect(links[2].getAttribute('href')).toBe('/statistics');
  });

  it('should hide sidenav links when logged out', async () => {
    fixture.componentRef.setInput('isLoggedIn', false);

    await fixture.whenStable();

    expect(sidenavLinks().length).toBe(0);
  });

  it('should render tab links when there is an active tab', async () => {
    const tabLinks: Link[] = [
      { name: 'Progress', url: '/shows/progress' },
      { name: 'Upcoming', url: '/shows/upcoming' },
    ];
    fixture.componentRef.setInput('activeTabLink', tabLinks[0]);
    fixture.componentRef.setInput('tabLinks', tabLinks);

    await fixture.whenStable();

    const tabs = nativeElement.querySelectorAll<HTMLAnchorElement>('a[mat-tab-link]');
    expect(linkTexts(tabs)).toEqual(['Progress', 'Upcoming']);
    expect(tabs[0].getAttribute('href')).toBe('/shows/progress');
    expect(tabs[1].getAttribute('href')).toBe('/shows/upcoming');
  });

  it('should not render tab links when there is no active tab', async () => {
    fixture.componentRef.setInput('activeTabLink', undefined);
    fixture.componentRef.setInput('tabLinks', [{ name: 'Progress', url: '/shows/progress' }]);

    await fixture.whenStable();

    expect(nativeElement.querySelectorAll('a[mat-tab-link]').length).toBe(0);
  });

  it('blurs active element when sidenav closes', () => {
    const activeElement = document.createElement('button');
    const blur = vi.fn();
    activeElement.blur = blur;

    vi.spyOn(document, 'activeElement', 'get').mockReturnValue(activeElement);

    component.sidenavClosedStart();

    expect(blur).toHaveBeenCalled();
  });

  it('blurs and aligns ink bar when sidenav opens', () => {
    const activeElement = document.createElement('button');
    const blur = vi.fn();
    const alignInkBar = vi.fn();
    activeElement.blur = blur;

    vi.spyOn(document, 'activeElement', 'get').mockReturnValue(activeElement);

    component.tabs = (() => ({
      selectedIndex: 0,
      _alignInkBarToSelectedTab: alignInkBar,
    })) as never;

    component.sidenavOpened();

    expect(blur).toHaveBeenCalled();
    expect(alignInkBar).toHaveBeenCalled();
  });

  it('does not navigate in previous when tabs are unavailable', async () => {
    const navigateByUrl = vi.spyOn(component.router, 'navigateByUrl');
    component.tabs = (() => undefined) as never;

    await component.previous();

    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('does not navigate in previous when computed link is missing', async () => {
    const navigateByUrl = vi.spyOn(component.router, 'navigateByUrl');
    fixture.componentRef.setInput('tabLinks', []);
    component.tabs = (() => ({ selectedIndex: 0 })) as never;

    await fixture.whenStable();
    await component.previous();

    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('navigates to previous tab using wrapped index', async () => {
    const navigateByUrl = vi
      .spyOn(component.router, 'navigateByUrl')
      .mockResolvedValue(true as never);
    const tabLinks: Link[] = [
      { name: 'Progress', url: '/shows/progress' },
      { name: 'Upcoming', url: '/shows/upcoming' },
    ];

    fixture.componentRef.setInput('tabLinks', tabLinks);
    component.tabs = (() => ({ selectedIndex: 0 })) as never;

    await fixture.whenStable();
    await component.previous();

    expect(navigateByUrl).toHaveBeenCalledWith('/shows/upcoming');
  });

  it('navigates to next tab using wrapped index', async () => {
    const navigateByUrl = vi
      .spyOn(component.router, 'navigateByUrl')
      .mockResolvedValue(true as never);
    const tabLinks: Link[] = [
      { name: 'Progress', url: '/shows/progress' },
      { name: 'Upcoming', url: '/shows/upcoming' },
    ];

    fixture.componentRef.setInput('tabLinks', tabLinks);
    component.tabs = (() => ({ selectedIndex: 1 })) as never;

    await fixture.whenStable();
    await component.next();

    expect(navigateByUrl).toHaveBeenCalledWith('/shows/progress');
  });

  function sidenavLinks(): NodeListOf<HTMLAnchorElement> {
    return nativeElement.querySelectorAll<HTMLAnchorElement>('a.sidenav-link');
  }

  function sidenavLinkLabels(): string[] {
    return Array.from(nativeElement.querySelectorAll<HTMLElement>('.sidenav-link-name')).map(
      (label) => label.textContent?.trim() ?? '',
    );
  }

  function linkTexts(links: ArrayLike<HTMLAnchorElement>): string[] {
    return Array.from(links).map((link) => link.textContent?.trim() ?? '');
  }
});

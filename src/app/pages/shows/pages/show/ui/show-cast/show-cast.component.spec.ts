import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowCastComponent } from './show-cast.component';
import type { Cast } from '@type/Tmdb';

describe('ShowCastComponent', () => {
  let fixture: ComponentFixture<ShowCastComponent>;
  let component: ShowCastComponent;

  const mockCast: Cast[] = [
    {
      adult: false,
      gender: 2,
      id: 1,
      known_for_department: 'Acting',
      name: 'Actor One',
      original_name: 'Actor One',
      popularity: 10,
      profile_path: '/path1.jpg',
      roles: [{ credit_id: 'c1', character: 'Character One', episode_count: 10 }],
      total_episode_count: 10,
      order: 0,
    },
    {
      adult: false,
      gender: 1,
      id: 2,
      known_for_department: 'Acting',
      name: 'Actor Two',
      original_name: 'Actor Two',
      popularity: 8,
      profile_path: null,
      roles: [{ credit_id: 'c2', character: 'Character Two', episode_count: 8 }],
      total_episode_count: 8,
      order: 1,
    },
  ];

  function createComponent(cast?: Cast[]): void {
    fixture = TestBed.createComponent(ShowCastComponent);
    component = fixture.componentInstance;
    if (cast !== undefined) {
      fixture.componentRef.setInput('cast', cast);
    }
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowCastComponent],
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should render nothing when cast is undefined', () => {
    createComponent();
    const castElements = fixture.nativeElement.querySelectorAll('.cast');
    expect(castElements.length).toBe(0);
  });

  it('should render cast members with profile images', () => {
    createComponent(mockCast);

    const castElements = fixture.nativeElement.querySelectorAll('.cast');
    expect(castElements.length).toBe(2);

    const profileImg = castElements[0].querySelector('img.cast-profile') as HTMLImageElement | null;
    expect(profileImg).toBeTruthy();
    expect(profileImg!.src).toBe('https://image.tmdb.org/t/p/w185/path1.jpg');
    expect(profileImg!.alt).toBe('Actor One');
  });

  it('should render placeholder image when profile_path is missing', () => {
    createComponent(mockCast);

    const castElements = fixture.nativeElement.querySelectorAll('.cast');
    const placeholderImg = castElements[1].querySelector(
      'img[alt="Actor Two"]',
    ) as HTMLImageElement | null;
    expect(placeholderImg).toBeTruthy();
    expect(placeholderImg!.src).toContain('/poster.png');
  });

  it('should render cast name and character', () => {
    createComponent(mockCast);

    const names = fixture.nativeElement.querySelectorAll('.cast-name');
    expect(names.length).toBe(2);
    expect(names[0].textContent.trim()).toBe('Actor One');
    expect(names[1].textContent.trim()).toBe('Actor Two');

    const characters = fixture.nativeElement.querySelectorAll('.cast-character');
    expect(characters.length).toBe(2);
    expect(characters[0].textContent.trim()).toBe('Character One');
    expect(characters[1].textContent.trim()).toBe('Character Two');
  });

  it('should link to Trakt search with encoded name', () => {
    createComponent(mockCast);

    const links = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    expect(links.length).toBe(2);
    expect(links[0].href).toBe('https://trakt.tv/search/people?query=Actor%20One');
    expect(links[1].href).toBe('https://trakt.tv/search/people?query=Actor%20Two');
  });
});

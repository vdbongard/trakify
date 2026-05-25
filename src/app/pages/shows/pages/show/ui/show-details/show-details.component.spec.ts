import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowDetailsComponent } from './show-details.component';
import type { TmdbShow } from '@type/Tmdb';

describe('ShowDetailsComponent', () => {
  let fixture: ComponentFixture<ShowDetailsComponent>;

  const emptyTmdbShow = {
    genres: [],
    created_by: [],
    first_air_date: '',
    vote_count: 0,
    vote_average: 0,
    episode_run_time: [],
    type: 'Scripted' as const,
  } as unknown as TmdbShow;

  function createComponent(tmdbShow?: TmdbShow): void {
    fixture = TestBed.createComponent(ShowDetailsComponent);
    if (tmdbShow !== undefined) {
      fixture.componentRef.setInput('tmdbShow', tmdbShow);
    }
    fixture.detectChanges();
  }

  function paragraphText(): string {
    return fixture.nativeElement.querySelector('p.mat-body-medium').textContent.trim();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowDetailsComponent],
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show no details available when tmdbShow is undefined', () => {
    createComponent();
    expect(paragraphText()).toBe('No details available.');
  });

  it('should show no details available when all fields are empty', () => {
    createComponent(emptyTmdbShow);
    expect(paragraphText()).toBe('No details available.');
  });

  it('should show genre when genres exist', () => {
    const show = {
      ...emptyTmdbShow,
      genres: [
        { id: 1, name: 'Drama' },
        { id: 2, name: 'Comedy' },
      ],
    } as unknown as TmdbShow;
    createComponent(show);
    expect(paragraphText()).toBe('Genre: Drama, Comedy');
  });

  it('should show created by when creators exist', () => {
    const show = {
      ...emptyTmdbShow,
      created_by: [{ id: 1, name: 'Creator One', credit_id: 'c1', gender: 0, profile_path: null }],
    } as unknown as TmdbShow;
    createComponent(show);
    expect(paragraphText()).toBe('Created by: Creator One');
  });

  it('should show first aired date with past date', () => {
    const show = { ...emptyTmdbShow, first_air_date: '2023-01-15' } as unknown as TmdbShow;
    createComponent(show);
    expect(paragraphText()).toBe('First aired:  15. Jan. 2023');
  });

  it('should show first airing with future date', () => {
    const show = { ...emptyTmdbShow, first_air_date: '2099-06-15' } as unknown as TmdbShow;
    createComponent(show);
    expect(paragraphText()).toBe('First airing:  15. Jun. 2099');
  });

  it('should show rating when vote count exists', () => {
    const show = { ...emptyTmdbShow, vote_count: 100, vote_average: 7.5 } as unknown as TmdbShow;
    createComponent(show);
    expect(paragraphText()).toBe('Rating: 7.5 (100 votes)');
  });

  it('should show runtime when episode run time exists', () => {
    const show = { ...emptyTmdbShow, episode_run_time: [45] } as unknown as TmdbShow;
    createComponent(show);
    expect(paragraphText()).toBe('Runtime: 45min');
  });

  it('should show type when type is not Scripted', () => {
    const show = { ...emptyTmdbShow, type: 'Reality' } as unknown as TmdbShow;
    createComponent(show);
    expect(paragraphText()).toBe('Type: Reality');
  });

  it('should not show type when type is Scripted', () => {
    createComponent(emptyTmdbShow);
    expect(fixture.nativeElement.textContent).not.toContain('Type:');
  });
});

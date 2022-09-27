import { e } from '../support/elements';

describe('Search', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/shows/search?sync=0');
  });

  it('should show empty search list first', () => {
    cy.get(e.searchInput).should('exist');
    cy.get(e.showItem).should('not.exist');
  });

  it('should focus the search input on load', () => {
    cy.get(e.searchInput).should('have.focus');
  });

  it.skip('should search for a show', () => {
    cy.intercept('https://api.trakt.tv/sync/watched/shows?extended=noseasons').as(
      'getShowsWatched'
    );

    cy.visit('/shows/s/game-of-thrones?sync=0');
    cy.contains('Mark as seen').click();
    cy.wait('@getShowsWatched');

    cy.visit('/shows/search?sync=0');
    cy.get(e.searchInput).type('g');
    cy.get(e.showItem).should('have.length', 1);

    cy.removeWatchedShows();
  });

  it('should search with no result', () => {
    cy.get(e.searchInput).type('a');
    cy.get(e.showItem).should('not.exist');
  });
});

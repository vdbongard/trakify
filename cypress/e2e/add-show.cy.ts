import { e } from '../support/elements';

describe('Add show', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/shows/add-show?sync=0');
  });

  it('should show the 10 currently most trending shows', () => {
    cy.contains('Trending').should('have.class', 'mat-chip-selected');
    cy.get(e.showItem).should('have.length', 10);
  });

  it('should show the 10 currently most popular shows', () => {
    cy.contains('Popular').click().should('have.class', 'mat-chip-selected');
    cy.get(e.showItem).should('have.length', 10);
  });

  it('should show the 10 recommended shows', () => {
    cy.contains('Recommended').click().should('have.class', 'mat-chip-selected');
    cy.get(e.showItem).should('have.length', 10);
  });

  it('should search a show', () => {
    cy.get(e.addShowSearchInput).type('Game of Thrones{enter}');
    cy.get(e.showItem).should('have.length.at.least', 1);
  });

  it('should add a show to the watchlist and remove it from the watchlist', () => {
    cy.intercept('https://api.trakt.tv/users/me/watchlist/shows').as('getWatchlist');

    // add
    cy.get(e.addShowSearchInput).type('Game of Thrones{enter}');
    cy.get(`${e.showItem}:first ${e.showItemAddButton}`).should('exist').click();
    cy.contains('Adding show to the watchlist...');
    cy.get(`${e.showItem}:first ${e.showItemRemoveButton}`).should('exist');

    // remove
    cy.visit('/shows/add-show?sync=0');
    cy.get(e.addShowSearchInput).type('Game of Thrones{enter}');
    cy.get(`${e.showItem}:first ${e.showItemRemoveButton}`).should('exist').click();
    cy.wait('@getWatchlist');
    cy.get(`${e.showItem}:first ${e.showItemAddButton}`).should('exist');
  });

  it.skip('should show if a show was added', () => {
    cy.intercept('https://api.trakt.tv/sync/watched/shows?extended=noseasons').as(
      'getShowsWatched'
    );

    // show is not added
    cy.get(e.addShowSearchInput).type('Game of Thrones{enter}');
    cy.get(e.showItem).should('have.length.at.least', 1); // wait for search results
    cy.get(`${e.showItem}:first ${e.showItemAdded}`).should('not.exist');

    // add show
    cy.get(e.showItem).first().click();
    cy.contains('Mark as seen')
      .should('exist')
      .should('not.be.disabled')
      .click()
      .should('not.be.disabled');
    cy.wait('@getShowsWatched');
    cy.contains('S01E02');

    // show was added
    cy.visit('/shows/add-show?sync=0');
    cy.get(e.addShowSearchInput).type('Game of Thrones{enter}');
    cy.get(`${e.showItem}:first ${e.showItemAdded}`).should('exist');

    // clean up
    cy.removeWatchedShows();
  });

  it('should open a show', () => {
    cy.get(e.showItem).first().click();
    cy.url().should('contain', Cypress.config().baseUrl + '#/shows/s/');
  });
});

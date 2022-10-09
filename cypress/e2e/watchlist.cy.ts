import { e } from '../support/elements';

describe('Watchlist', () => {
  before(() => {
    cy.removeWatchlistItems();
  });

  beforeEach(() => {
    cy.login();
    cy.visit('/shows/watchlist?sync=0');
  });

  it('should show empty list', () => {
    cy.contains('No shows in the list.');
  });

  it.skip('should add/remove show from watchlist', () => {
    // add
    cy.visit('/shows/add-show?search=Game%20of%20Thrones&sync=0');
    cy.get(`${e.showItem}:first ${e.showItemAddButton}`).should('exist').click();
    cy.contains('Adding show to the watchlist...');
    cy.get(`${e.showItem}:first ${e.showItemRemoveButton}`).should('exist');
    cy.visit('/shows/watchlist?sync=0');
    cy.get(e.showItem).should('have.length', 1);

    // remove
    cy.get(e.showItemMenu).click();
    cy.contains('Remove from watchlist').click();
    cy.get(e.showItem).should('not.exist');
  });
});

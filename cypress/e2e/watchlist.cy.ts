import { e } from '../support/elements';

describe('Watchlist', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/series/watchlist?sync=0');
  });

  it('should show empty list', () => {
    cy.contains('No shows in the list.');
  });

  it.skip('should add/remove show from watchlist', () => {
    // add
    cy.visit('/series/add-series?search=Game%20of%20Thrones&sync=0');
    cy.get(`${e.showItem}:first ${e.showItemAddButton}`).should('exist').click();
    cy.contains('Added show to the watchlist');
    cy.get(`${e.showItem}:first ${e.showItemRemoveButton}`).should('exist');
    cy.visit('/series/watchlist?sync=0');
    cy.get(e.showItem).should('have.length', 1);

    // remove
    cy.get(e.showItemMenu).click();
    cy.contains('Remove from watchlist').click();
    cy.get(e.showItem).should('not.exist');
  });
});

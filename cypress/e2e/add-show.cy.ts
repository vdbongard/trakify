import { e } from '../support/elements';

describe('Add show', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/series/add-series?sync=0');
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
    cy.get('input[type="search"]').type('Game of Thrones{enter}');
    cy.get(e.showItem).should('have.length.at.least', 1);
  });

  it('should add a show to the watchlist and remove it from the watchlist', () => {
    // add
    cy.get('input[type="search"]').type('Game of Thrones{enter}');
    cy.get(`${e.showItem}:first ${e.showItemAddButton}`).should('exist').click();
    cy.contains('Added show to the watchlist');
    cy.get(`${e.showItem}:first ${e.showItemRemoveButton}`).should('exist');

    // remove
    cy.visit('/series/add-series?sync=0');
    cy.get('input[type="search"]').type('Game of Thrones{enter}');
    cy.get(`${e.showItem}:first ${e.showItemRemoveButton}`).should('exist').click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(100); // wait for remove from watchlist
    cy.get(`${e.showItem}:first ${e.showItemAddButton}`).should('exist');
  });

  it('should show if a show was added', () => {
    // show is not added
    cy.get('input[type="search"]').type('Game of Thrones{enter}');
    cy.get(e.showItem).should('have.length.at.least', 1); // wait for search results
    cy.get(`${e.showItem}:first ${e.showItemAdded}`).should('not.exist');

    // add show
    cy.get(e.showItem).first().click();
    cy.contains('Mark as seen').should('not.be.disabled').click().should('not.be.disabled');
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(100); // wait for episode mark as seen
    cy.contains('S01E02');

    // show was added
    cy.visit('/series/add-series?sync=0');
    cy.get('input[type="search"]').type('Game of Thrones{enter}');
    cy.get(`${e.showItem}:first ${e.showItemAdded}`).should('exist');

    // remove show (clean up)
    cy.visit('http://localhost:4200/series/s/game-of-thrones/season/1/episode/1?sync=0');
    cy.contains('Mark as unseen').click().should('not.be.disabled');
    cy.contains('Mark as seen');
  });

  it('should open a show', () => {
    cy.get(e.showItem).first().click();
    cy.url().should('contain', Cypress.config().baseUrl + 'series/s/');
  });
});

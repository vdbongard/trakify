import { e } from '../support/elements';

describe('Search', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/series/search?sync=0');
  });

  it('should show empty search list first', () => {
    cy.get(e.searchInput).should('exist');
    cy.get(e.showItem).should('not.exist');
  });

  it('should search for a show', () => {});

  it('should search with no result', () => {});
});

describe('Watchlist', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/series/watchlist');
  });

  it('should show empty list', () => {
    cy.contains('No shows in the list.');
  });

  it('should add/remove show from watchlist', () => {
    // add
    cy.visit('/series/add-series?search=Game%20of%20Thrones');
    cy.get('[data-test-id="show"]:first [data-test-id="add-button"]').should('exist').click();
    cy.contains('Added show to the watchlist');
    cy.get('[data-test-id="show"]:first [data-test-id="remove-button"]').should('exist');
    cy.visit('/series/watchlist');
    cy.get('[data-test-id="show"]').should('have.length', 1);

    // remove
    cy.get('[data-test-id="show-item-menu"]').click();
    cy.contains('Remove from watchlist').click();
    cy.get('[data-test-id="show"]').should('not.exist');
  });
});

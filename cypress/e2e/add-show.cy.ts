describe('Add show', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/series/add-series');
  });

  it('should show the 10 currently most trending shows', () => {
    cy.contains('Trending').should('have.class', 'mat-chip-selected');
    cy.get('[data-test-id="show"]').should('have.length', 10);
  });

  it('should show the 10 currently most popular shows', () => {
    cy.contains('Popular').click().should('have.class', 'mat-chip-selected');
    cy.get('[data-test-id="show"]').should('have.length', 10);
  });

  it('should show the 10 recommended shows', () => {
    cy.contains('Recommended').click().should('have.class', 'mat-chip-selected');
    cy.get('[data-test-id="show"]').should('have.length', 10);
  });

  it('should search a show', () => {
    cy.get('input[type="search"]').type('Game of Thrones{enter}');
    cy.get('[data-test-id="show"]').should('have.length.at.least', 1);
  });

  it('should add a show to the watchlist', () => {
    cy.get('input[type="search"]').type('Game of Thrones{enter}');
    cy.get('[data-test-id="show"]:first [data-test-id="add-button"]').should('exist').click();
    cy.contains('Added show to the watchlist');
    cy.get('[data-test-id="show"]:first [data-test-id="remove-button"]').should('exist');
  });

  it('should remove a show from the watchlist', () => {
    cy.get('input[type="search"]').type('Game of Thrones{enter}');
    cy.get('[data-test-id="show"]:first [data-test-id="remove-button"]').should('exist').click();
    cy.get('[data-test-id="show"]:first [data-test-id="add-button"]').should('exist');
  });

  it.skip('should show if a show was added', () => {
    cy.get('input[type="search"]').type('Game of Thrones{enter}');
    cy.get('[data-test-id="show"]').first().click();
    cy.contains('Mark as seen').click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(4000); // wait for sync (to add episode)
    cy.visit('/series/add-series');
    cy.get('input[type="search"]').type('Game of Thrones{enter}');
    cy.get('[data-test-id="show"]:first [data-test-id="show-added"]').should('exist');
  });

  it('should open a show', () => {
    cy.get('[data-test-id="show"]').first().click();
    cy.url().should('contain', '/series/s/');
  });
});

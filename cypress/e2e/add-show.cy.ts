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
});

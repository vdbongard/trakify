describe('Statistics', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/statistics');
  });

  it('should show empty statistics', () => {
    cy.contains('0 / 0');
    cy.contains('0 shows running');
    cy.contains('0 shows with next episode');
  });

  it('should show statistics', () => {});
});

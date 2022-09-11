describe('Statistics', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/statistics?sync=0');
  });

  it('should show empty statistics', () => {
    cy.contains('0 / 0');
    cy.contains('0 shows running');
    cy.contains('0 shows with next episode');
  });

  it('should show statistics', () => {});
});

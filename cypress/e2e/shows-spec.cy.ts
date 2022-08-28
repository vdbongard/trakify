describe('Login', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/series');
  });

  it('should show empty list', () => {
    cy.contains('No shows in the list.');
  });
});

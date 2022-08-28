describe('Upcoming', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/series/upcoming');
  });

  it('should show empty list', () => {
    cy.contains('No shows in the list.');
  });
});

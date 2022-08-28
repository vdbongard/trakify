describe('Lists', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/lists');
  });

  it('should show empty list', () => {
    cy.contains('No list added.');
  });
});

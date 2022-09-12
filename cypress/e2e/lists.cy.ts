describe('Lists', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/lists');
  });

  it('should show empty list', () => {
    cy.contains('No list added.');
  });

  it.skip('should show a list', () => {});

  it.skip('should navigate to a list', () => {});

  it.skip('should add a list', () => {});

  it.skip('should remove a list', () => {});

  it.skip('should manage list items', () => {});
});

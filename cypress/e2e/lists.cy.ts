describe('Lists', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/lists');
  });

  it('should show empty list', () => {
    cy.contains('No list added.');
  });

  it('should show a list', () => {});

  it('should navigate to a list', () => {});

  it('should add a list', () => {});

  it('should remove a list', () => {});

  it('should manage list items', () => {});
});

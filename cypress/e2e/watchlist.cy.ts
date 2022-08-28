describe('Watchlist', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/series/watchlist');
  });

  it('should show empty list', () => {
    cy.contains('No shows in the list.');
  });
});

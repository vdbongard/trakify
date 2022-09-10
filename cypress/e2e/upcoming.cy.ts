describe('Upcoming', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/series/upcoming');
  });

  it('should show empty list', () => {
    cy.contains('No shows in the list.');
  });

  it('should show upcoming shows', () => {});

  it('should filter out watchlist shows', () => {});
});

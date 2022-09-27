describe('Upcoming', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/shows/upcoming?sync=0');
  });

  it('should show empty list', () => {
    cy.contains('No shows in the list.');
  });

  it.skip('should show upcoming shows', () => {});

  it.skip('should filter out watchlist shows', () => {});
});

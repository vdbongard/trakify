describe('Shows', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/shows?sync=0');
  });

  it('should show empty list', () => {
    cy.contains('No shows in the list.');
  });

  it.skip('should show a show', () => {});

  it.skip('should manage lists for a show', () => {});

  it.skip('should mark a show as seen', () => {});

  it.skip('should add/remove a show from favorites', () => {});

  it.skip('should remove a show', () => {});
});

describe('Shows', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/series?sync=0');
  });

  it('should show empty list', () => {
    cy.contains('No shows in the list.');
  });

  it('should show a show', () => {});

  it('should manage lists for a show', () => {});

  it('should mark a show as seen', () => {});

  it('should add/remove a show from favorites', () => {});

  it('should remove a show', () => {});
});

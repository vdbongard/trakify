describe('Episode', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('http://localhost:4200/series/s/game-of-thrones/season/1/episode/1?sync=0');
  });

  it('should show the episode', () => {
    cy.contains('Game of Thrones / Season 1 / Episode 1').should('exist');
    cy.contains('18. Apr. 2011 (Mon.)').should('exist');
    cy.contains('S01E01 Winter Is Coming').should('exist');
    cy.contains('Mark as seen').should('not.be.disabled');
    cy.contains('Jon Arryn, the').should('exist');
    cy.contains('Source: TMDB').should('exist');
  });

  it('should jump to the next/previous episode', () => {});

  it('should prevent jumping to the next/previous episode if it does not exist', () => {});

  it('should mark the episode as seen/unseen', () => {});

  it('should navigate via the breadcrumb', () => {});
});

import { e } from '../support/elements';

describe('Show', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/series/s/game-of-thrones?sync=0');
  });

  it('should show a show page', () => {
    cy.get(e.showPosterImage).should('exist').should('not.have.attr', 'src', 'assets/poster.png');
    // todo check for other show data
  });

  it.skip('should manage lists for a show', () => {});

  it('should mark a show as seen', () => {
    cy.intercept('GET', ' https://api.trakt.tv/shows/1390/progress/watched*').as('getShowProgress');

    cy.get(e.topbarMenu).click();
    cy.get('.cdk-overlay-container').contains('Mark as seen').click();
    cy.get('.mat-dialog-container button').contains('Mark as seen').click();
    cy.wait('@getShowProgress', { timeout: 10000 });

    cy.visit('/series/s/game-of-thrones?sync=0');
    cy.get(e.showPosterImage).should('exist').should('not.have.attr', 'src', 'assets/poster.png');
  });

  it.skip('should add/remove a show from favorites', () => {});

  it.skip('should show the next episode and navigate to it', () => {});

  it.skip('should mark the next episode as seen', () => {});

  it.skip('should show the seasons', () => {});

  it.skip('should open a season', () => {});
});

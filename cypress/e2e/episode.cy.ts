import { e } from '../support/elements';

describe('Episode', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/shows/s/game-of-thrones/season/1/episode/1?sync=0');
  });

  it('should show the episode', () => {
    cy.contains('Game of Thrones / Season 1 / Episode 1').should('exist');
    cy.get('.title').contains('Winter Is Coming').should('exist');
    cy.contains('18. Apr. 2011 (Mon.)').should('exist');
    cy.contains('S01E01 Winter Is Coming').should('exist');
    cy.contains('Mark as seen').should('not.be.disabled');
    cy.contains('Jon Arryn, the').should('exist');
    cy.contains('Source: TMDB').should('exist');
  });

  it('should jump to the next/previous episode', () => {
    cy.get(e.episodeNextButton).click();
    cy.url().should(
      'equal',
      `${Cypress.config().baseUrl}#/shows/s/game-of-thrones/season/1/episode/2`,
    );

    cy.get(e.episodePreviousButton).click();
    cy.url().should(
      'equal',
      `${Cypress.config().baseUrl}#/shows/s/game-of-thrones/season/1/episode/1`,
    );
  });

  it('should prevent jumping to the next/previous episode if it does not exist', () => {
    // previous disabled
    cy.get(e.episodePreviousButton).should('have.attr', 'disabled');

    // next disabled
    cy.visit('/shows/s/game-of-thrones/season/1/episode/10?sync=0');
    cy.get(e.episodeNextButton).should('have.attr', 'disabled');
  });

  it.skip('should mark the episode as seen/unseen', () => {
    cy.contains('Mark as seen').click();

    cy.contains('Mark as unseen').should('not.be.disabled').click();

    cy.contains('Mark as seen').click();
  });

  it('should navigate via the breadcrumb to the show', () => {
    cy.contains('Game of Thrones').click();
    cy.url().should('equal', `${Cypress.config().baseUrl}#/shows/s/game-of-thrones`);
  });

  it('should navigate via the breadcrumb to the season', () => {
    cy.contains('Season 1').click();
    cy.url().should('equal', `${Cypress.config().baseUrl}#/shows/s/game-of-thrones/season/1`);
  });

  it('should navigate via the breadcrumb to the show', () => {
    cy.contains('Episode 1').click();
    cy.url().should(
      'equal',
      `${Cypress.config().baseUrl}#/shows/s/game-of-thrones/season/1/episode/1`,
    );
  });
});

import { e } from '../support/elements';

describe('Topbar', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/?sync=0');
  });

  it('should navigate to the main page when clicking the logo', () => {
    cy.get(e.logo).click();
    cy.url().should('contain', Cypress.config().baseUrl + 'series');
  });

  it('should set the language', () => {});

  it('should sync manually', () => {});

  it('should check for updates', () => {});

  it('should log out', () => {
    cy.get(e.topbarMenu).click();
    cy.contains('Logout').click();
    cy.url().should('contain', Cypress.config().baseUrl + 'login');
  });
});

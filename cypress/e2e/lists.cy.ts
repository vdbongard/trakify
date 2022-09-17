import { e } from '../support/elements';

describe('Lists', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/lists?sync=0');
  });

  it('should show empty list', () => {
    cy.contains('No list added.');
  });

  it('should add a list', () => {
    cy.get(e.listAddButton).click();
    cy.get(e.listAddInput).type('a');
    cy.get('.mat-dialog-container button').contains('Create').click();
    cy.get('.mat-tab-link').contains('a').should('exist');
  });

  it('should navigate to a list', () => {
    cy.intercept('https://api.trakt.tv/users/me/lists/*/items/show').as('getListItems');

    // create list a
    cy.get(e.listAddButton).click();
    cy.get(e.listAddInput).type('a');
    cy.get('.mat-dialog-container button').contains('Create').click();
    cy.wait('@getListItems');

    // create list b
    cy.get(e.listAddButton).click();
    cy.get(e.listAddInput).type('b');
    cy.get('.mat-dialog-container button').contains('Create').click();
    cy.wait('@getListItems');

    // navigate to list a
    cy.get('.mat-tab-link').contains('a').click();
    cy.url().should('equal', Cypress.config().baseUrl + '#/lists?slug=a');
  });

  it('should remove a list', () => {
    // create list a
    cy.get(e.listAddButton).click();
    cy.get(e.listAddInput).type('a');
    cy.get('.mat-dialog-container button').contains('Create').click();
    cy.get('.mat-tab-link').contains('a').should('exist');

    // remove list a
    cy.get(e.listRemoveButton).click();
    cy.get('.mat-dialog-container button').contains('Remove').click();
    cy.get('.mat-tab-link').contains('a').should('not.exist');
  });

  it('should manage list items', () => {});
});

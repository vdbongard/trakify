import { e } from '../support/elements';

describe('Lists', () => {
  before(() => {
    cy.removeLists();
  });

  beforeEach(() => {
    cy.login();
    cy.visit('/lists?sync=0');
  });

  it('should show empty list', () => {
    cy.contains('No list added.');
  });

  it('should add and remove a list', () => {
    // create list a
    cy.get(e.listAddButton).click();
    cy.get(e.listAddInput).type('List a');
    cy.get('.mat-dialog-container button').contains('Create').click();
    cy.get('.mat-tab-link').contains('List a').should('exist');

    // remove list a
    cy.get(e.listRemoveButton).click();
    cy.get('.mat-dialog-container button').contains('Remove').click();
    cy.get('.mat-tab-link').contains('List a').should('not.exist');
  });

  it('should navigate to a list', () => {
    cy.intercept('https://api.trakt.tv/users/me/lists/*/items/show').as('getListItems');

    // create list a
    cy.get(e.listAddButton).click();
    cy.get(e.listAddInput).type('List a');
    cy.get('.mat-dialog-container button').contains('Create').click().wait('@getListItems');

    // create list b
    cy.get(e.listAddButton).click();
    cy.get(e.listAddInput).type('List b');
    cy.get('.mat-dialog-container button').contains('Create').click().wait('@getListItems');

    // navigate to list a
    cy.get('.mat-tab-link').contains('List a').click();
    cy.url().should('equal', Cypress.config().baseUrl + '#/lists?slug=list-a');

    // remove list a
    cy.get(e.listRemoveButton).click();
    cy.get('.mat-dialog-container button').contains('Remove').click();
    cy.get('.mat-tab-link').contains('List a').should('not.exist');

    // remove list b
    cy.get(e.listRemoveButton).click();
    cy.get('.mat-dialog-container button').contains('Remove').click();
    cy.get('.mat-tab-link').contains('List a').should('not.exist');
  });

  it('should manage list items', () => {});
});

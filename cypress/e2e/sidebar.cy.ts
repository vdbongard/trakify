describe('Sidebar', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
  });

  it('should show the sidebar', () => {
    cy.get('.sidenav').should('exist');
  });

  it('should navigate to shows', () => {
    cy.get('.sidenav').within(() => {
      cy.contains('Shows').click();
      cy.url().should('equal', Cypress.config().baseUrl + 'series');
    });
  });

  it('should navigate to lists', () => {
    cy.get('.sidenav').within(() => {
      cy.contains('Lists').click();
      cy.url().should('equal', Cypress.config().baseUrl + 'lists');
    });
  });

  it('should navigate to statistics', () => {
    cy.get('.sidenav').within(() => {
      cy.contains('Statistics').click();
      cy.url().should('equal', Cypress.config().baseUrl + 'statistics');
    });
  });
});

describe('Login', () => {
  it('should log in via the trakt website', () => {
    cy.clearLocalStorage();
    cy.visit('/login?sync=0');
    cy.contains('Login to Trakt').click();

    cy.origin('https://api.trakt.tv', () => {
      cy.url().should('equal', 'https://api.trakt.tv/auth/signin');
      cy.get('#user_login').type(Cypress.env('EMAIL'));
      cy.get('#user_password').type(`${Cypress.env('PASSWORD')}{enter}`);
    });

    cy.url().should('equal', Cypress.config().baseUrl + 'series');
  });

  it('should open the redirect page when trying to open redirect with wrong credentials', () => {
    cy.visit('/redirect?code=foo&state=bar&sync=0');
    cy.url().should('contain', Cypress.config().baseUrl + 'redirect');
    cy.contains('Error');

    cy.visit('/redirect?sync=0');
    cy.url().should('contain', Cypress.config().baseUrl + 'redirect');
    cy.contains('Error');
  });

  it.only('should log in with the custom login function', () => {
    cy.login();
    cy.visit('/?sync=0');
    cy.url().should('contain', Cypress.config().baseUrl + 'series');
  });
});

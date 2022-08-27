describe('Login', () => {
  it('should log in', () => {
    cy.visit('/login');
    cy.contains('Login to Trakt').click();

    cy.origin('https://api.trakt.tv', () => {
      cy.url().should('equal', 'https://api.trakt.tv/auth/signin');
      cy.get('#user_login').type(Cypress.env('email'));
      cy.get('#user_password').type(`${Cypress.env('password')}{enter}`);
    });

    cy.url().should('contain', '/series');
  });

  it('should open redirect page when trying to open redirect with wrong credentials', () => {
    cy.visit('/redirect?code=foo&state=bar');
    cy.url().should('contain', '/redirect');
  });

  it('should show error visiting redirect without credentials', () => {
    cy.visit('/redirect');
    cy.contains('Error');
  });
});

describe('Login', () => {
  it('should log in', () => {
    cy.visit('/login');
    cy.contains('Login to Trakt').click();

    cy.origin('https://api.trakt.tv', () => {
      cy.url().should('equal', 'https://api.trakt.tv/auth/signin');
      cy.get('#user_login').type(Cypress.env('EMAIL'));
      cy.get('#user_password').type(`${Cypress.env('PASSWORD')}{enter}`);
    });

    cy.url().should('contain', '/series');
  });

  it('should open redirect page when trying to open redirect with wrong credentials', () => {
    cy.visit('/redirect?code=foo&state=bar');
    cy.url().should('contain', '/redirect');
    cy.contains('Error');

    cy.visit('/redirect');
    cy.url().should('contain', '/redirect');
    cy.contains('Error');
  });

  it('should log in with the access token', () => {
    localStorage.setItem('access_token', Cypress.env('ACCESSTOKEN'));

    cy.visit('/');
    cy.url().should('contain', '/series');
  });
});

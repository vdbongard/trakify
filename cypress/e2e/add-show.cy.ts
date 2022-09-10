describe('Add show', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/series/add-series');
  });

  it('should show the 10 currently most trending shows', () => {
    cy.contains('Trending').should('have.class', 'mat-chip-selected');
    cy.get('[data-test-id="show"]').should('have.length', 10);
  });

  it('should show the 10 currently most popular shows', () => {
    cy.contains('Popular').click().should('have.class', 'mat-chip-selected');
    cy.get('[data-test-id="show"]').should('have.length', 10);
  });

  it('should show the 10 recommended shows', () => {
    cy.contains('Recommended').click().should('have.class', 'mat-chip-selected');
    cy.get('[data-test-id="show"]').should('have.length', 10);
  });

  it('should search a show', () => {
    cy.get('input[type="search"]').type('Game of Thrones{enter}');
    cy.get('[data-test-id="show"]').should('have.length.at.least', 1);
  });

  it('should add a show to the watchlist and remove it from the watchlist', () => {
    // add
    cy.get('input[type="search"]').type('Game of Thrones{enter}');
    cy.get('[data-test-id="show"]:first [data-test-id="add-button"]').should('exist').click();
    cy.contains('Added show to the watchlist');
    cy.get('[data-test-id="show"]:first [data-test-id="remove-button"]').should('exist');

    // remove
    cy.visit('/series/add-series');
    cy.get('input[type="search"]').type('Game of Thrones{enter}');
    cy.get('[data-test-id="show"]:first [data-test-id="remove-button"]').should('exist').click();
    cy.get('[data-test-id="show"]:first [data-test-id="add-button"]').should('exist');
  });

  it('should show if a show was added', () => {
    // show is not added
    cy.get('input[type="search"]').type('Game of Thrones{enter}');
    cy.get('[data-test-id="show"]').should('have.length.at.least', 1); // wait for search results
    cy.get('[data-test-id="show"]:first [data-test-id="show-added"]').should('not.exist');

    // add show
    cy.get('[data-test-id="show"]').first().click();
    cy.contains('Mark as seen').should('not.be.disabled').click();
    cy.contains('S01E02');

    // show was added
    cy.visit('/series/add-series');
    cy.get('input[type="search"]').type('Game of Thrones{enter}');
    cy.get('[data-test-id="show"]:first [data-test-id="show-added"]').should('exist');

    // remove show (clean up)
    cy.visit('http://localhost:4200/series/s/game-of-thrones/season/1/episode/1');
    cy.contains('Mark as unseen').click();
    cy.contains('Mark as seen');
  });

  it('should open a show', () => {
    cy.get('[data-test-id="show"]').first().click();
    cy.url().should('contain', '/series/s/');
  });
});

declare namespace Cypress {
  interface Chainable {
    login(): Chainable<void>;
    removeWatchedShows(): Chainable<void>;
    removeLists(): Chainable<void>;
    removeWatchlistItems(): Chainable<void>;
  }
}

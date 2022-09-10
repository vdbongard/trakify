// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// When a command from ./commands is ready to use, import with `import './commands'` syntax
import './commands';
import { Config } from '../../src/app/config';
import { ShowWatched } from '@type/interfaces/Trakt';

before(() => {
  // remove watched shows
  cy.request({
    url: 'https://api.trakt.tv/sync/watched/shows?extended=noseasons',
    headers: {
      ...Config.traktOptions.headers,
      authorization: `Bearer ${Cypress.env('ACCESSTOKEN')}`,
    },
  })
    .its('body')
    .then((showsWatched: ShowWatched[]) => {
      if (!showsWatched.length) return;
      cy.request({
        method: 'POST',
        url: 'https://api.trakt.tv/sync/history/remove',
        headers: {
          ...Config.traktOptions.headers,
          authorization: `Bearer ${Cypress.env('ACCESSTOKEN')}`,
        },
        body: {
          shows: showsWatched.map((showWatched) => showWatched.show),
        },
      });
    });
});

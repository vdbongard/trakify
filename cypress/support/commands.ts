// ***********************************************
// This example namespace declaration will help
// with Intellisense and code completion in your
// IDE or Text Editor.
// ***********************************************
// declare namespace Cypress {
//   interface Chainable<Subject = any> {
//     customCommand(param: any): typeof customCommand;
//   }
// }
//
// function customCommand(param: any): void {
//   console.warn(param);
// }
//
// NOTE: You can use it like so:
// Cypress.Commands.add('customCommand', customCommand);
//
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import { Config } from '@shared/config';
import type { ShowWatched } from '@type/Trakt';
import type { List, WatchlistItem } from '@type/TraktList';

Cypress.Commands.add('login', () => {
  localStorage.setItem('access_token', Cypress.env('ACCESSTOKEN'));
  localStorage.setItem('refresh_token', Cypress.env('REFRESHTOKEN'));
  localStorage.setItem('expires_at', Cypress.env('EXPIRESAT'));
  localStorage.setItem('access_token_stored_at', Cypress.env('ACCESSTOKENSTOREDAT'));
});

Cypress.Commands.add('removeWatchedShows', () => {
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
      cy.log(`Shows watched: ${showsWatched.length.toString()}`);
      cy.log('Deleting shows watched...');
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1010);
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

Cypress.Commands.add('removeLists', () => {
  cy.request({
    url: 'https://api.trakt.tv/users/me/lists',
    headers: {
      ...Config.traktOptions.headers,
      authorization: `Bearer ${Cypress.env('ACCESSTOKEN')}`,
    },
  })
    .its('body')
    .then((lists: List[]) => {
      if (!lists.length) return;
      cy.log(`List length: ${lists.length.toString()}`);
      cy.log('Deleting lists...');
      lists.forEach((list) => {
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(1010);
        cy.request({
          method: 'DELETE',
          url: `https://api.trakt.tv/users/me/lists/${list.ids.slug}`,
          headers: {
            ...Config.traktOptions.headers,
            authorization: `Bearer ${Cypress.env('ACCESSTOKEN')}`,
          },
        });
      });
    });
});

Cypress.Commands.add('removeWatchlistItems', () => {
  cy.request({
    url: 'https://api.trakt.tv/users/me/watchlist/shows',
    headers: {
      ...Config.traktOptions.headers,
      authorization: `Bearer ${Cypress.env('ACCESSTOKEN')}`,
    },
  })
    .its('body')
    .then((watchlistItems: WatchlistItem[]) => {
      if (!watchlistItems.length) return;
      cy.log(`Watchlist length: ${watchlistItems.length.toString()}`);
      cy.log('Deleting watchlist items...');
      watchlistItems.forEach((watchlistItem) => {
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(1010);
        cy.request({
          method: 'POST',
          url: 'https://api.trakt.tv/sync/watchlist/remove',
          body: { shows: [{ ids: watchlistItem.show.ids }] },
          headers: {
            ...Config.traktOptions.headers,
            authorization: `Bearer ${Cypress.env('ACCESSTOKEN')}`,
          },
        });
      });
    });
});

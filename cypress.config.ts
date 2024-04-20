import { defineConfig } from 'cypress';
import PluginConfigOptions = Cypress.PluginConfigOptions;

export default defineConfig({
  defaultCommandTimeout: 8000,
  e2e: {
    baseUrl: 'http://localhost:4200/',
    setupNodeEvents(on, config): PluginConfigOptions | void {
      if (config.isTextTerminal) {
        return { ...config, excludeSpecPattern: ['cypress/e2e/$all.cy.ts'] };
      }
    },
  },
});

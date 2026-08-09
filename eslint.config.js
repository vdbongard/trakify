// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 't',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 't',
          style: 'kebab-case',
        },
      ],
      // Explicit function return types increase the readability, so they should always be included.
      '@typescript-eslint/explicit-function-return-type': 'error',
      // TS ignore is needed for external libraries that are not typed.
      '@typescript-eslint/ban-ts-comment': 'off',
      // Empty function are needed for tests to override functionality.
      '@typescript-eslint/no-empty-function': 'off',
      // Useless constructor can be removed without problems.
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          filter: {
            regex:
              '^(watched_at|collected_at|rated_at|watchlisted_at|recommendations_at|commented_at|' +
              'paused_at|liked_at|blocked_at|settings_at|followed_at|following_at|pending_at|' +
              'requested_at|saved_filters|not_found|trakt-api-version|trakt-api-key|listed_at|' +
              'allow_comments|comment_count|created_at|display_numbers|item_count|sort_by|' +
              'sort_how|vip_ep|Authorization|last_episode|last_watched_at|last_updated_at|' +
              'start_at|updated_at|aggregate_credits|air_date|episode_count|episode_number|' +
              'first_aired|next_episode|poster_path|profile_path|reset_at|season_number|' +
              'still_path|credit_id|known_for_department|original_name|total_episode_count|' +
              'created_by|first_air_date|vote_count|vote_average|episode_run_time|' +
              'number_of_episodes|number_of_seasons|external_ids|twitter_id|instagram_id|' +
              'facebook_id|hidden_at|aired_episodes|available_translations|backdrop_path|' +
              'collected_count|collector_count|english_name|freebase_id|freebase_mid|' +
              'guest_stars|imdb_id|in_production|iso_3166_1|iso_639_1|last_air_date|' +
              'last_episode_to_air|list_count|logo_path|next_episode_to_air|number_abs|' +
              'origin_country|original_language|original_title|play_count|production_code|' +
              'production_companies|production_countries|published_at|social_ids|spoken_languages|' +
              'tvdb_id|tvrage_id|user_count|watcher_count|access_token|access_token_stored_at|' +
              'already_in_list|expires_at|first-list|id_token|keep-watching|refresh_token|' +
              'second-list|token_type|1|2|3|4|5|6|7|8|9|10|' +
              '\\[class\\.ticker\\]|\\[style\\.--animated-text-width\\]|\\(mouseenter\\)|' +
              '\\(mouseleave\\)|\\(pointerdown\\))$',
            match: false,
          },
          leadingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          format: ['camelCase'],
        },
        {
          selector: 'classProperty',
          modifiers: ['protected', 'readonly'],
          format: ['PascalCase'],
        },
        {
          selector: 'property',
          modifiers: ['static'],
          format: ['camelCase'],
        },
        {
          selector: 'property',
          modifiers: ['readonly'],
          format: ['camelCase', 'UPPER_CASE'],
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE'],
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'variable',
          modifiers: ['const'],
          // PascalCase only for custom objects, UPPER_CASE only for CONSTANTS
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase'],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
  {
    ignores: ['dist/', '.angular/', '.vscode/', '.github/'],
  },
]);

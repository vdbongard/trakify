module.exports = {
  singleQuote: true,
  printWidth: 100,
  overrides: [
    {
      files: '*.html',
      options: {
        parser: 'angular',
      },
    },
  ],
};

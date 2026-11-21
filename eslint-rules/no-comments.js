// @ts-check
const directive =
  /^\s*(eslint-|@ts-|noinspection|oxfmt-ignore|prettier-ignore|@vite-ignore|\/\s*<reference)/;

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban comments. Decisions belong in docs/adr, not beside the code.',
    },
    schema: [],
    messages: {
      comment: 'Comments are banned. Record the decision in docs/adr instead.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          if (directive.test(comment.value)) continue;
          context.report({ loc: comment.loc, messageId: 'comment' });
        }
      },
    };
  },
};

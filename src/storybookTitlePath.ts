import { Rule } from 'eslint';

export function storybookTitlePathRule(
  context: Rule.RuleContext,
): Rule.RuleListener {
  return {
    ExportDefaultDeclaration(node) {
      console.log(context.getPhysicalFilename());
      // if the default export is not an object, exit
      if (node.declaration.type !== 'ObjectExpression') {
        context.report({
          node,
          message: 'Storybook `default export` must always be of type `object`',
        });
        return;
      }

      // we expect every story to have a `title` property
      const titleProperty = node.declaration.properties.find(
        (property) =>
          property.type === 'Property' &&
          property.key.type === 'Identifier' &&
          property.key.name === 'title',
      );

      // if there is no `title` property, warn the user that they should have
      // a title property provided
      if (!titleProperty) {
        context.report({
          node,
          message: 'Stories must always have a provided `title` property',
        });
        return;
      }

      if (titleProperty.type !== 'Property') {
        context.report({
          node: titleProperty,
          message:
            'Story meta key `title` data is malformed or incorrectly formatted',
        });
        return;
      }

      // to determine the correct `title`, we need to know the current path
      let fullPath = context.getPhysicalFilename().split('/');

      // keep removing leading element til we get to views, as engineers may
      // have the repo placed in very different directories, however, we know
      // every story within the repo exists within `/app/assets/webpack/views`
      while (fullPath[0] !== 'views') {
        fullPath.shift();
      }
      // we don't want every story to be grouped under `/views` but rather
      // subgroups, like inventories, span, or orders
      fullPath.shift();

      // path as story title
      // e.g. `inventories/components/OrderForecastV2/Content/MetricCard`
      const expectedStoryPath = fullPath.join('/');

      if (titleProperty.value.type !== 'Literal') {
        context.report({
          node: titleProperty,
          message: 'Story meta key `title` data must be of type `string`',
        });
        return;
      }

      if (titleProperty.value.value !== expectedStoryPath) {
        context.report({
          node: titleProperty,
          message: `Expected story \`title\` to be '${expectedStoryPath}', but '${titleProperty.value.value}' was found`,
          fix: (fixer) => {
            return fixer.replaceText(titleProperty.value, expectedStoryPath);
          },
        });
        return;
      }
    },
  };
}

import { createTranslator } from 'yapyak/translator';

const RULES = {
  Hello: {
    sv: 'Hej',
  },
};

export default {
  translator: createTranslator({
    id: 'fixture',
    async translate({ items, targetLocales }) {
      return items.map((item) => {
        const result = {};
        for (const locale of targetLocales) {
          result[locale] = RULES[item.source]?.[locale] ?? item.source;
        }
        return result;
      });
    },
  }),
};

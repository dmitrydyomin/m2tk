import { camelCase } from 'camel-case';

import { interfaceName } from './interfaces';

export const generateKnexWrapper = (tables: string[]) => {
  return (
    `export class DB {
  constructor(public knex: Knex) {}\n` +
    tables
      .map(
        (t) =>
          `  get ${camelCase(t)}() {\n    return this.knex<${interfaceName(
            t
          )}>('${t}');\n  }`
      )
      .join('\n') +
    `\n}`
  );
};

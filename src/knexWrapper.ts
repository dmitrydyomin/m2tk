import { camelCase } from 'camel-case';

import { config } from './config';
import { interfaceName } from './interfaces';

export const generateKnexWrapper = (
  tables: { table: string; database?: string }[],
  constructor = true
) => {
  return (
    `export class DB {\n` +
    (config.constructor
      ? `  constructor(public readonly knex: Knex) {}\n`
      : '  public readonly knex: Knex;\n') +
    tables
      .map(
        (t) =>
          `  get ${camelCase(
            `${t.database ? `${t.database}_` : ''}${t.table}`
          )}() {\n    return this.knex<${interfaceName(
            t.table,
            t.database
          )}>('${t.database ? `${t.database}.` : ''}${t.table}');\n  }`
      )
      .join('\n') +
    `\n}`
  );
};

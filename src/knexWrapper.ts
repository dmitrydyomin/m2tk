import { camelCase } from 'camel-case';

import { config } from './config';
import { interfaceName } from './interfaces';

export const generateKnexWrapper = (tables: string[], constructor = true) => {
  return (
    `export class DB {\n` +
  (config.constructor ? `  constructor(public knex: Knex) {}\n` : '  public knex: Knex;\n') +
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

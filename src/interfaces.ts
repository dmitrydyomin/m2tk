import { addSingularRule, singular } from 'pluralize';
import { pascalCase } from 'pascal-case';

import { Column } from './db';
import { config } from './config';

addSingularRule('data', 'data');

const mapTypes = (t: string) => {
  if (config.boolean && t.indexOf('tinyint') !== -1) {
    return 'boolean';
  }
  if (
    t.indexOf('int') !== -1 ||
    t.indexOf('decimal') !== -1 ||
    t.indexOf('double') !== -1 ||
    t.indexOf('binary') !== -1
  ) {
    return 'number';
  }
  if (t.indexOf('char') !== -1 || t.indexOf('text') !== -1) {
    return 'string';
  }
  if (t.indexOf('enum') !== -1) {
    return t.split(/[\(\)]/)[1].replace(/,/g, ' | ');
  }
  if (t.indexOf('date') !== -1 || t === 'timestamp') {
    return 'Date';
  }
  if (t === 'json') {
    return 'any';
  }
  if (t === 'time') {
    return 'string';
  }
  return t;
};

const columnToProp = (c: Column) =>
  `${c.Field}: ${mapTypes(c.Type)}${c.Null === 'YES' ? ' | null' : ''};`;

export const interfaceName = (tableName: string, database?: string) => {
  const parts = tableName.split('_');
  if (database) {
    parts.unshift(database);
  }
  const name = pascalCase(parts.map(singular).join('_'));
  return `${config.prefix}${name}`;
};

export const getInterfaceForTable = (
  tableName: string,
  columns: Column[],
  database?: string
) => {
  const props = columns.map(columnToProp);
  return (
    `export interface ${interfaceName(tableName, database)} {\n  ` +
    props.join('\n  ') +
    `\n}\n`
  );
};

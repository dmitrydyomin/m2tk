import { pascalCase } from 'pascal-case';
import { addSingularRule, singular } from 'pluralize';

import { Column } from './db';

addSingularRule('data', 'data');

const mapTypes = (t: string) => {
  // if (t === 'tinyint unsigned') {
  //   return 'boolean';
  // }
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
  if (t.indexOf('date') !== -1 || t === 'timestamp') {
    return 'Date';
  }
  if (t === 'time') {
    return 'string';
  }
  return t;
};

const columnToProp = (c: Column) =>
  `${c.Field}: ${mapTypes(c.Type)}${c.Null === 'YES' ? ' | null' : ''};`;

export const interfaceName = (tableName: string) => {
  const parts = tableName.split('_');
  return pascalCase(parts.map(singular).join('_'));
};

export const getInterfaceForTable = (tableName: string, columns: Column[]) => {
  const props = columns.map(columnToProp);
  return (
    `export interface ${interfaceName(tableName)} {\n  ` +
    props.join('\n  ') +
    `\n}\n`
  );
};
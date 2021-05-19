import Knex, { Knex as KnexType } from 'knex';
import path from 'path';

const skipTables = ['knex_migrations', 'knex_migrations_lock'];

let config: KnexType.Config = {
  client: 'mysql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'db',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password',
    charset: 'utf8mb4',
  },
};

try {
  config = require(path.join(process.cwd(), 'knexfile.js'));
} catch (err) {}

export const db = Knex(config);

export interface Column {
  Field: string;
  Type: string;
  Null: 'YES' | 'NO';
  Key: string;
  Default: null | string | number;
  Extra: unknown;
}

export const getTableNames = async () => {
  const tables: string[] = (await db.raw('SHOW TABLES'))[0].map(
    (t: any) => Object.values(t)[0]
  );
  return tables.filter((t) => !skipTables.includes(t));
};

export const getTableColumns = async (tableName: string) => {
  const rows: [Column[], unknown] = (await db.raw(
    'SHOW COLUMNS FROM `' + tableName + '`'
  )) as any;

  return rows[0];
};

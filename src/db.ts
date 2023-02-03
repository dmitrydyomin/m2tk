import fs from 'fs';
import Knex, { Knex as KnexType } from 'knex';
import path from 'path';
import requireFromString from 'require-from-string';

let config: KnexType.Config = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'db',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password',
    charset: 'utf8mb4',
  },
};

const configPath = path.join(process.cwd(), 'knexfile.js');

try {
  config = require(configPath);
} catch (err: any) {
  if (
    err.code === 'ERR_REQUIRE_ESM' ||
    err.message.includes(`Unexpected token 'export'`)
  ) {
    const content = fs.readFileSync(configPath, 'utf-8');
    const cjs = content.replace(/export\s+default/, 'module.exports =');
    config = requireFromString(cjs);
  }
}

const database = (config as any)?.connection?.database || '';
const skipTables = ['knex_migrations', 'knex_migrations_lock'];
const skipDbs = ['information_schema', 'performance_schema', database];

export const db = Knex(config);

export interface Column {
  Field: string;
  Type: string;
  Null: 'YES' | 'NO';
  Key: string;
  Default: null | string | number;
  Extra: unknown;
}

export const getOtherDbNames = async () => {
  const tables: string[] = (await db.raw('SHOW DATABASES'))[0].map(
    (t: any) => Object.values(t)[0]
  );
  return tables.filter((t) => !skipDbs.includes(t));
};

export const getTableNames = async (dbName?: string) => {
  const tables: string[] = (
    await db.raw(`SHOW TABLES FROM \`${dbName || database}\``)
  )[0].map((t: any) => Object.values(t)[0]);
  return tables.filter((t) => !skipTables.includes(t));
};

export const getTableColumns = async (tableName: string, database?: string) => {
  const rows: [Column[], unknown] = (await db.raw(
    `SHOW COLUMNS FROM ${database ? `\`${database}\`.` : ''}\`${tableName}\``
  )) as any;

  return rows[0];
};

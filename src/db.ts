import fs from 'fs';
import Knex, { Knex as KnexType } from 'knex';
import path from 'path';
import requireFromString from 'require-from-string';

const pg = process.env.DB_CLIENT === 'pg';
export const ms = process.env.DB_CLIENT === 'mssql';

let config: KnexType.Config = {
  client: pg ? 'pg' : ms ? 'mssql' : 'mysql2',
  connection: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? (pg ? '5432' : ms ? '1433' : '3306')),
    database: process.env.DB_NAME ?? 'db',
    user: process.env.DB_USER ?? 'user',
    password: process.env.DB_PASSWORD ?? 'password',
    charset: pg || ms ? undefined : 'utf8mb4',
  },
};

if (process.env.DB_SCHEMA) {
  config.searchPath = [process.env.DB_SCHEMA];
}

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

const database = (config as any)?.connection?.database ?? '';
const skipTables = ['knex_migrations', 'knex_migrations_lock'];
const skipDbs = ['information_schema', 'performance_schema', database];

export const db = Knex(config);

const pgSchema = config.searchPath?.[0] ?? 'public';

export interface Column {
  Field: string;
  Type: string;
  Null: 'YES' | 'NO';
  Key: string;
  Default: null | string | number;
  Extra: unknown;
}

export const getOtherDbNames = async () => {
  if (!pg) {
    const tables: string[] = (await db.raw('SHOW DATABASES'))[0].map(
      (t: any) => Object.values(t)[0]
    );
    return tables.filter((t) => !skipDbs.includes(t));
  }
  return [];
};

export const getTableNames = async (dbName?: string) => {
  if (!pg && !ms) {
    const tables: string[] = (
      await db.raw(`SHOW TABLES FROM \`${dbName ?? database}\``)
    )[0].map((t: any) => Object.values(t)[0]);
    return tables.filter((t) => !skipTables.includes(t));
  }

  if (ms) {
    const tables = await db('INFORMATION_SCHEMA.TABLES')
      .where({
        TABLE_TYPE: 'BASE TABLE',
        TABLE_CATALOG: db.raw('db_name()'),
      })
      .orderBy('TABLE_NAME')
      .pluck('TABLE_NAME');
    return tables.filter((t) => !skipTables.includes(t));
  }

  const tables = await db('information_schema.tables')
    .where({ table_schema: pgSchema })
    .orderBy('table_name')
    .pluck<string[]>('table_name');
  return tables.filter((t) => !skipTables.includes(t));
};

export const getTableColumns = async (tableName: string, database?: string) => {
  if (!pg && !ms) {
    const rows: [Column[], unknown] = (await db.raw(
      `SHOW COLUMNS FROM ${database ? `\`${database}\`.` : ''}\`${tableName}\``
    )) as any;

    return rows[0];
  }

  if (ms) {
    const rows = await db<{
      COLUMN_NAME: string;
      DATA_TYPE: string;
      IS_NULLABLE: 'YES' | 'NO';
      TABLE_NAME: string;
    }>('INFORMATION_SCHEMA.COLUMNS')
      .where({ TABLE_NAME: tableName })
      .select(['COLUMN_NAME', 'DATA_TYPE', 'IS_NULLABLE']);

    return rows.map(
      (r): Column => ({
        Field: r.COLUMN_NAME,
        Type: r.DATA_TYPE,
        Null: r.IS_NULLABLE,
        Key: '',
        Default: null,
        Extra: null,
      })
    );
  }

  const rows = await db('information_schema.columns')
    .where({ table_name: tableName, table_schema: pgSchema })
    .orderBy('ordinal_position')
    .select<Column[]>({
      Field: 'column_name',
      Type: 'data_type',
      Null: 'is_nullable',
    });

  const enums = await getEnumColumns(tableName);
  return rows.map((r): Column => ({ ...r, Type: enums[r.Field] ?? r.Type }));
};

async function getEnumColumns(tableName: string) {
  const rows = await db('information_schema.constraint_column_usage as ccu')
    .innerJoin(
      'information_schema.check_constraints as cc',
      'cc.constraint_name',
      'ccu.constraint_name'
    )
    .where('cc.constraint_schema', pgSchema)
    .where('ccu.table_schema', pgSchema)
    .where('ccu.table_name', tableName)
    .select<{ column_name: string; check_clause: string }[]>([
      'column_name',
      'check_clause',
    ]);

  const res: Record<string, string> = {};

  rows.forEach((r) => {
    // (("checksumType" = ANY (ARRAY['CRC32'::text, 'CRC32C'::text, 'SHA1'::text, 'SHA256'::text])))
    const m = r.check_clause.match(/ARRAY\[(('\w+'::text),?\s*)+\]/);
    if (m) {
      const re = /'(\w+)'::text/g;
      const options: string[] = [];

      while (true) {
        const m1 = re.exec(m[0]);
        if (!m1) {
          break;
        }
        options.push(m1[1]);
      }
      if (options.length > 0) {
        res[r.column_name] = `enum(${options.map((o) => `'${o}'`).join(',')})`;
      }
    }
  });

  return res;
}

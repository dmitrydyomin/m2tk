import { Knex } from 'knex';

import { getOtherDbNames, getTableColumns, getTableNames } from './db';
import { getInterfaceForTable } from './interfaces';
import { generateKnexWrapper } from './knexWrapper';
import { config as optsConfig } from './config';

export const run = (config?: Knex.Config) =>
  (async () => {
    const dbTables = await getTableNames();

    const tables: { table: string; database?: string }[] = [
      ...dbTables.map((table) => ({ table })),
    ];

    if (optsConfig.otherSchemas) {
      const otherDbs = await getOtherDbNames();
      for (const database of otherDbs) {
        const tn = await getTableNames(database);
        tn.forEach((table) => {
          tables.push({ table, database });
        });
      }
    }

    const tablesWithColumns = await Promise.all(
      tables.map(async (table) => ({
        table,
        cols: await getTableColumns(table.table, table.database),
      }))
    );

    const interfaces = tablesWithColumns
      .map(({ table, cols }) =>
        getInterfaceForTable(table.table, cols, table.database)
      )
      .join('\n');

    const wrapper = generateKnexWrapper(tables);

    console.log(
      `import { Knex } from 'knex';\n\n` + interfaces + '\n' + wrapper
    );
  })()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });

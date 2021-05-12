import { getInterfaceForTable } from './interfaces';
import { getTableColumns, getTableNames } from './db';
import { generateKnexWrapper } from './knexWrapper';

export const run = () =>
  (async () => {
    const tables = await getTableNames();

    const tablesWithColumns = await Promise.all(
      tables.map(async (table) => ({
        table,
        cols: await getTableColumns(table),
      }))
    );

    const interfaces = tablesWithColumns
      .map(({ table, cols }) => getInterfaceForTable(table, cols))
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

run();

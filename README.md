# MySQL to TypeScript Knex

Generates TypeScript types for Knex.js using MySQL tables.

## Getting started

Create `knexfile.js`:

```js
module.exports = {
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    port: 3306,
    database: 'db',
    user: 'user',
    password: 'password',
    charset: 'utf8mb4',
  },
};
```

Run:

```bash
npx m2tk --prefix=Db > src/db/DbTypes.ts
```

You can put the command into your `package.json` scripts section:

```json
{
  "scripts": {
    "types": "m2tk --prefix=Db > src/core/services/DbTypes.ts"
  }
}
```

This command will generate DbTypes.ts with contents like:

```typescript
import { Knex } from 'knex';

export interface DbUser {
  id: number;
  createdAt: Date;
  username: string;
  password: string;
}

export class DB {
  constructor(public readonly knex: Knex) {}
  get authenticators() {
    return this.knex<DbUser>('users');
  }
}
```

You could use the generated class in the folloing manner:

db.ts:

```typescript
import knex from 'knex';

import { DB } from './DbTypes';
import { config } from './config';
import { registerService } from './registerService';

class DBT extends DB {
  transaction<T>(callback: (db: DB) => Promise<T>) {
    return this.knex.transaction((trx) => callback(new DB(trx)));
  }
}

export const db = new DBT(
  knex({
    client: 'mysql2',
    // ...
  })
);
```

Somewhere in the app:

```typescript
const user = await db.users.where({ username: input.username }).first();
// user is DbUser | undefined
```

/*eslint-disable @typescript-eslint/no-explicit-any*/

import { Kysely, sql } from 'kysely';

export const up = async (conn: Kysely<any>) => {
    await conn.schema
        .createTable('api_keys')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('name', 'varchar(255)', (col) => col.notNull())
        .addColumn('key', 'varchar(255)', (col) => col.notNull().unique())
        .addColumn('created_at', 'datetime', (col) =>
            col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
        )
        .addColumn('user_id', 'integer', (col) =>
            col.references('users.id').onDelete('cascade').notNull()
        )
        .execute();
};

export const down = async (conn: Kysely<any>) => {
    await conn.schema.dropTable('api_keys').execute();
};

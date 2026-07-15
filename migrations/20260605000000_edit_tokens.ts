/*eslint-disable @typescript-eslint/no-explicit-any*/

import { Kysely, sql } from 'kysely';

export const up = async (conn: Kysely<any>) => {
    await conn.schema
        .createTable('edit_tokens')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('file_id', 'varchar(36)', (col) =>
            col.references('files.id').onDelete('cascade').notNull()
        )
        .addColumn('created_by', 'integer', (col) =>
            col.references('users.id').onDelete('cascade').notNull()
        )
        .addColumn('token_hash', 'varchar(255)', (col) => col.notNull().unique())
        .addColumn('created_at', 'datetime', (col) =>
            col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
        )
        .addColumn('expires_at', 'datetime', (col) => col.notNull())
        .addColumn('consumed_at', 'datetime')
        .execute();
};

export const down = async (conn: Kysely<any>) => {
    await conn.schema.dropTable('edit_tokens').execute();
};

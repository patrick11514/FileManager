/*eslint-disable @typescript-eslint/no-explicit-any*/

import { Kysely, sql } from 'kysely';
import bcrypt from 'bcrypt';

export const up = async (conn: Kysely<any>) => {
    await conn.schema
        .createTable('users')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('username', 'varchar(255)', (col) => col.notNull().unique())
        .addColumn('password', 'varchar(255)', (col) => col.notNull())
        .execute();

    await conn.schema
        .createTable('files')
        .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
        .addColumn('original_name', 'varchar(255)', (col) => col.notNull())
        .addColumn('mime_type', 'varchar(255)', (col) => col.notNull())
        .addColumn('size', 'integer', (col) => col.notNull())
        .addColumn('upload_date', 'datetime', (col) =>
            col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
        )
        .addColumn('uploaded_by', 'integer', (col) =>
            col.references('users.id').onDelete('cascade')
        )
        .execute();

    const hashedPassword = await bcrypt.hash('admin', 10);

    await conn
        .insertInto('users')
        .values({
            username: 'admin',
            password: hashedPassword
        })
        .execute();
};

export const down = async (conn: Kysely<any>) => {
    await conn.schema.dropTable('files').execute();
    await conn.schema.dropTable('users').execute();
};

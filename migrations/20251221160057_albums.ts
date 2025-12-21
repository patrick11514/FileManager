/*eslint-disable @typescript-eslint/no-explicit-any*/

import { Kysely, sql } from 'kysely';

export const up = async (conn: Kysely<any>) => {
    // Create albums table
    await conn.schema
        .createTable('albums')
        .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
        .addColumn('name', 'varchar(255)', (col) => col)
        .addColumn('created_at', 'datetime', (col) =>
            col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
        )
        .addColumn('created_by', 'integer', (col) => col.references('users.id').onDelete('cascade'))
        .execute();

    // Create album_images junction table
    await conn.schema
        .createTable('album_images')
        .addColumn('album_id', 'varchar(36)', (col) =>
            col.notNull().references('albums.id').onDelete('cascade')
        )
        .addColumn('file_id', 'varchar(36)', (col) =>
            col.notNull().references('files.id').onDelete('cascade')
        )
        .addPrimaryKeyConstraint('album_images_pk', ['album_id', 'file_id'])
        .execute();
};

export const down = async (conn: Kysely<any>) => {
    await conn.schema.dropTable('album_images').execute();
    await conn.schema.dropTable('albums').execute();
};

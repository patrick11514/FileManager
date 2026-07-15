/*eslint-disable @typescript-eslint/no-explicit-any*/

import { Kysely } from 'kysely';

export const up = async (conn: Kysely<any>) => {
    await conn.schema
        .alterTable('album_images')
        .addColumn('display_order', 'integer', (col) => col.notNull().defaultTo(0))
        .execute();
};

export const down = async (conn: Kysely<any>) => {
    await conn.schema.alterTable('album_images').dropColumn('display_order').execute();
};

import type { DB } from '$/types/database';
import {
    DATABASE_IP,
    DATABASE_NAME,
    DATABASE_PASSWORD,
    DATABASE_PORT,
    DATABASE_USER,
    JWT_SECRET
} from '$env/static/private';
import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import { JWTCookies } from './cookies';

export const jwt = new JWTCookies(JWT_SECRET);
const dialect = new MysqlDialect({
    pool: createPool({
        host: DATABASE_IP,
        port: parseInt(DATABASE_PORT),
        user: DATABASE_USER,
        password: DATABASE_PASSWORD,
        database: DATABASE_NAME
    })
});

export const conn = new Kysely<DB>({
    dialect
});

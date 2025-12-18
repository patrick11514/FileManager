import { APICreate, MiddleWareError } from '@patrick115/sveltekitapi';
import crypto from 'crypto';
import type { Context } from './context';
import { conn } from './variables';

export const api = new APICreate<Context>();

export const router = api.router;
export const procedure = api.procedure;
export const authProcedure = procedure.use(async ({ ctx, next }) => {
    if (!ctx.logged) {
        throw new MiddleWareError({
            status: false,
            code: 401,
            message: 'Unauthorized'
        });
    }
    return next(ctx.data);
});

export const tokenProcedure = procedure.use(async ({ next, ev }) => {
    const authHeader = ev.request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new MiddleWareError({
            status: false,
            code: 401,
            message: 'Unauthorized'
        });
    }

    const token = authHeader.split(' ')[1];
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const apiKey = await conn
        .selectFrom('api_keys')
        .selectAll()
        .where('key', '=', hashedToken)
        .executeTakeFirst();

    if (!apiKey) {
        throw new MiddleWareError({
            status: false,
            code: 401,
            message: 'Unauthorized'
        });
    }

    const user = await conn
        .selectFrom('users')
        .selectAll()
        .where('id', '=', apiKey.user_id)
        .executeTakeFirst();

    if (!user) {
        throw new MiddleWareError({
            status: false,
            code: 401,
            message: 'Unauthorized'
        });
    }

    return next({
        id: user.id,
        username: user.username
    });
});

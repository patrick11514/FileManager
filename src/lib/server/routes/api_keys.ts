import crypto from 'crypto';
import { z } from 'zod';
import { authProcedure } from '../api';
import { conn } from '../variables';

export const apiKeysRouter = {
    create: authProcedure.POST.input(
        z.object({
            name: z.string().min(1)
        })
    ).query(async ({ input, ctx }) => {
        const key = crypto.randomBytes(32).toString('hex');
        const hashedKey = crypto.createHash('sha256').update(key).digest('hex');

        await conn
            .insertInto('api_keys')
            .values({
                name: input.name,
                key: hashedKey,
                user_id: ctx.id
            })
            .execute();

        return {
            status: true,
            data: {
                key
            }
        };
    }),
    list: authProcedure.GET.query(async ({ ctx }) => {
        const keys = await conn
            .selectFrom('api_keys')
            .select(['id', 'name', 'created_at'])
            .where('user_id', '=', ctx.id)
            .execute();

        return {
            status: true,
            data: keys
        };
    }),
    delete: authProcedure.DELETE.input(
        z.object({
            id: z.number()
        })
    ).query(async ({ input, ctx }) => {
        await conn
            .deleteFrom('api_keys')
            .where('id', '=', input.id)
            .where('user_id', '=', ctx.id)
            .execute();

        return {
            status: true,
            data: {
                success: true
            }
        };
    })
};

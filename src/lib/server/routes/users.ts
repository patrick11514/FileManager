import { type ErrorApiResponse } from '@patrick115/sveltekitapi';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import type { SuccessApiResponse } from '../../../types/types';
import { authProcedure } from '../api';
import { conn } from '../variables';

export const usersRouter = {
    create: authProcedure.POST.input(
        z.object({
            username: z.string(),
            password: z.string()
        })
    ).query(async ({ input }) => {
        const hashedPassword = await bcrypt.hash(input.password, 10);

        try {
            await conn
                .insertInto('users')
                .values({
                    username: input.username,
                    password: hashedPassword
                })
                .execute();
        } catch {
            return {
                status: false,
                code: 400,
                message: 'User already exists'
            } satisfies ErrorApiResponse;
        }

        const data = { success: true };
        return {
            status: true,
            data
        } satisfies SuccessApiResponse<typeof data>;
    }),
    list: authProcedure.GET.query(async () => {
        const data = await conn.selectFrom('users').select(['id', 'username']).execute();
        return {
            status: true,
            data
        } satisfies SuccessApiResponse<typeof data>;
    })
};

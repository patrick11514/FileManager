import { type ErrorApiResponse } from '@patrick115/sveltekitapi';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import type { SuccessApiResponse } from '../../../types/types';
import { procedure } from '../api';
import { conn, jwt } from '../variables';

export const authRouter = {
    login: procedure.POST.input(
        z.object({
            username: z.string(),
            password: z.string()
        })
    ).query(async ({ input, ev }) => {
        const user = await conn
            .selectFrom('users')
            .selectAll()
            .where('username', '=', input.username)
            .executeTakeFirst();

        if (!user) {
            return {
                status: false,
                code: 401,
                message: 'Invalid credentials'
            } satisfies ErrorApiResponse;
        }

        const valid = await bcrypt.compare(input.password, user.password);

        if (!valid) {
            return {
                status: false,
                code: 401,
                message: 'Invalid credentials'
            } satisfies ErrorApiResponse;
        }

        const token = jwt.setCookie({ id: user.id, username: user.username });

        ev.cookies.set('session', token, {
            path: '/',
            httpOnly: true,
            secure: false, // Should be true in production
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        const data = { success: true };
        return {
            status: true,
            data
        } satisfies SuccessApiResponse<typeof data>;
    }),
    logout: procedure.POST.query(async ({ ev }) => {
        ev.cookies.delete('session', { path: '/' });
        return {
            status: true,
            data: { success: true }
        } satisfies SuccessApiResponse<{ success: true }>;
    })
};

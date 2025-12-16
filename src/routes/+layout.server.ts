import { context } from '$/lib/server/context';
import { Server } from '$/lib/server/server';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async (event) => {
    const { url } = event;

    const ctx = await context(event);

    if (!ctx.logged && url.pathname !== '/login') {
        throw redirect(302, '/login');
    }

    if (ctx.logged && url.pathname === '/login') {
        throw redirect(302, '/');
    }

    return {
        api: Server.hydrateToClient(),
        user: ctx.logged ? ctx.data : null
    };
}) satisfies LayoutServerLoad;

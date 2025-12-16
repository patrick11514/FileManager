import { Server } from '$/lib/server/server';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
    const res = await Server.ssr.users.list(event);
    if (!res.status) {
        throw error(res.code, res.message);
    }
    return {
        users: res.data
    };
}) satisfies PageServerLoad;

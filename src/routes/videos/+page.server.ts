import { Server } from '$/lib/server/server';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
    const res = await Server.ssr.files.list(event, {
        limit: 40,
        offset: 0,
        type: 'video',
        orderBy: 'upload_date',
        orderDir: 'desc'
    });
    if (!res.status) {
        throw error(res.code, res.message);
    }
    return {
        videos: res.data
    };
}) satisfies PageServerLoad;

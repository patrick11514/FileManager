import { Server } from '$/lib/server/server';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
    const res = await Server.ssr.files.list(event);
    if (!res.status) {
        throw error(res.code, res.message);
    }
    const files = res.data;
    const images = files.filter((f) => f.mime_type.startsWith('image/'));
    return {
        images
    };
}) satisfies PageServerLoad;

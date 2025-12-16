import { Server } from '$/lib/server/server';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
    const orderBy =
        (event.url.searchParams.get('orderBy') as 'upload_date' | 'original_name' | 'size') ||
        'upload_date';
    const orderDir = (event.url.searchParams.get('orderDir') as 'asc' | 'desc') || 'desc';

    const res = await Server.ssr.files.list(event, {
        limit: 40,
        offset: 0,
        type: 'image',
        orderBy,
        orderDir
    });
    if (!res.status) {
        throw error(res.code, res.message);
    }
    return {
        images: res.data
    };
}) satisfies PageServerLoad;

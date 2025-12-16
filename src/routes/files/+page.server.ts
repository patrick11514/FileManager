import { Server } from '$/lib/server/server';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
    const orderBy =
        (event.url.searchParams.get('orderBy') as 'upload_date' | 'original_name' | 'size') ||
        'upload_date';
    const orderDir = (event.url.searchParams.get('orderDir') as 'asc' | 'desc') || 'desc';

    const res = await Server.ssr.files.list(event, {
        limit: 1000,
        offset: 0,
        orderBy,
        orderDir
    });
    if (!res.status) {
        throw error(res.code, res.message);
    }
    const files = res.data;
    const otherFiles = files.filter(
        (f) => !f.mime_type.startsWith('image/') && !f.mime_type.startsWith('video/')
    );
    return {
        files: otherFiles
    };
}) satisfies PageServerLoad;

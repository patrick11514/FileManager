import { Server } from '$/lib/server/server';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
    const { id } = event.params;
    try {
        const res = await Server.ssr.files.get(event, { id });
        if (!res.status) {
            throw error(res.code, res.message);
        }
        return {
            file: res.data
        };
    } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = e as any;
        if (err?.status && err?.body?.message) {
            throw error(err.status, err.body.message);
        }
        throw error(404, 'File not found');
    }
}) satisfies PageServerLoad;

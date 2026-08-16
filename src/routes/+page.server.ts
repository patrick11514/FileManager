import { Server } from '$/lib/server/server';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    let folders: { id: string; name: string; fileCount: number }[] = [];
    let albums: { id: string; name: string | null; imageCount: number }[] = [];

    try {
        const foldersRes = await Server.ssr.folders.list(event);
        if (foldersRes.status) {
            folders = foldersRes.data;
        }
    } catch {
        // user may not be logged in or error
    }

    try {
        const albumsRes = await Server.ssr.albums.list(event);
        if (albumsRes.status) {
            albums = albumsRes.data;
        }
    } catch {
        // user may not be logged in or error
    }

    return {
        uploadLimit: env.BODY_SIZE_LIMIT || '512kb',
        folders,
        albums
    };
};

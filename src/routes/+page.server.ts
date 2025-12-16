import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    return {
        uploadLimit: env.BODY_SIZE_LIMIT || '512kb'
    };
};

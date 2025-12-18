import type { UserData, UserState } from '$/types/types';
import type { Cookies } from '@sveltejs/kit';
import { mkdir, stat, writeFile } from 'fs/promises';
import path from 'path/win32';
import { v4 as uuidv4 } from 'uuid';
import { conn, jwt } from './variables';

export const getCookieData = (cookies: Cookies): UserState => {
    const cookie = cookies.get('session');
    if (!cookie) {
        return {
            logged: false
        };
    }

    const data = jwt.getCookie<UserData>(cookie);

    if (!data) {
        return {
            logged: false
        };
    }

    return {
        logged: true,
        data
    };
};

export const existsAsync = async (path: string) => {
    try {
        await stat(path);
        return true;
    } catch {
        return false;
    }
};

export const uploadFile = async (fd: FormData, user_id: number) => {
    const file = fd.get('file') as File;
    if (!file) {
        return null;
    }

    const id = uuidv4();
    const originalName = file.name || 'unknown';
    const ext = path.extname(originalName);

    const filename = `${id}${ext}`;
    const uploadDir = path.resolve('uploads');

    if (!(await existsAsync(uploadDir))) {
        await mkdir(uploadDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    await conn
        .insertInto('files')
        .values({
            id,
            original_name: originalName,
            mime_type: file.type,
            size: file.size,
            uploaded_by: user_id
        })
        .execute();

    return {
        id: id,
        path: filePath
    };
};

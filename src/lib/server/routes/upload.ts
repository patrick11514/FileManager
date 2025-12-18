import { AnyFormDataInput, type ErrorApiResponse } from '@patrick115/sveltekitapi';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { tokenProcedure } from '../api';
import { conn } from '../variables';

export default tokenProcedure.POST.input(AnyFormDataInput).query(async ({ ctx, input, ev }) => {
    const file = input.get('file') as File;
    if (!file) {
        return {
            status: false,
            code: 400,
            message: 'No file uploaded'
        } satisfies ErrorApiResponse;
    }

    const id = uuidv4();
    const originalName = file.name || 'unknown';
    const ext = path.extname(originalName);
    const filename = `${id}${ext}`;
    const uploadDir = path.resolve('uploads');

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    await conn
        .insertInto('files')
        .values({
            id,
            original_name: originalName,
            mime_type: file.type,
            size: file.size,
            uploaded_by: ctx.id
        })
        .execute();

    let type = 'files';
    if (file.type.startsWith('image/')) {
        type = 'images';
    } else if (file.type.startsWith('video/')) {
        type = 'videos';
    }

    const rawUrl = `${ev.url.origin}/raw/${type}/${filename}`;

    return {
        status: true,
        data: rawUrl
    };
});

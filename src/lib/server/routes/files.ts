import { AnyFormDataInput, type ErrorApiResponse } from '@patrick115/sveltekitapi';
import { unlink, writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import type { SuccessApiResponse } from '../../../types/types';
import { authProcedure } from '../api';
import { conn } from '../variables';

export const filesRouter = {
    upload: authProcedure.POST.input(AnyFormDataInput).query(async ({ input, ctx }) => {
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

        const data = { success: true, id };
        return {
            status: true,
            data
        } satisfies SuccessApiResponse<typeof data>;
    }),
    list: authProcedure.GET.query(async () => {
        const data = await conn
            .selectFrom('files')
            .selectAll()
            .orderBy('upload_date', 'desc')
            .execute();
        return {
            status: true,
            data
        } satisfies SuccessApiResponse<typeof data>;
    }),
    get: authProcedure.POST.input(z.object({ id: z.string() })).query(async ({ input }) => {
        const file = await conn
            .selectFrom('files')
            .selectAll()
            .where('id', '=', input.id)
            .executeTakeFirst();
        if (!file) {
            return {
                status: false,
                code: 404,
                message: 'File not found'
            } satisfies ErrorApiResponse;
        }
        return {
            status: true,
            data: file
        } satisfies SuccessApiResponse<typeof file>;
    }),
    delete: authProcedure.POST.input(z.object({ id: z.string() })).query(async ({ input }) => {
        const file = await conn
            .selectFrom('files')
            .selectAll()
            .where('id', '=', input.id)
            .executeTakeFirst();
        if (!file) {
            return {
                status: false,
                code: 404,
                message: 'File not found'
            } satisfies ErrorApiResponse;
        }

        const ext = path.extname(file.original_name);
        const filename = `${file.id}${ext}`;
        const filePath = path.join(path.resolve('uploads'), filename);

        try {
            await unlink(filePath);
        } catch (e) {
            console.error('Failed to delete file from disk', e);
        }

        await conn.deleteFrom('files').where('id', '=', input.id).execute();

        const data = { success: true };
        return {
            status: true,
            data
        } satisfies SuccessApiResponse<typeof data>;
    })
};

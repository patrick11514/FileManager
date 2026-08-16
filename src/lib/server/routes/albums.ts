import type { SuccessApiResponse } from '$/types/types';
import { type ErrorApiResponse } from '@patrick115/sveltekitapi';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { authProcedure, procedure } from '../api';
import { conn } from '../variables';

export const albumsRouter = {
    create: authProcedure.POST.input(
        z.object({
            name: z.string().optional(),
            fileIds: z.array(z.string()).default([])
        })
    ).query(async ({ input, ctx }) => {
        if (input.fileIds.length > 0) {
            // Verify all files exist and belong to images
            const files = await conn
                .selectFrom('files')
                .select(['id', 'mime_type'])
                .where('id', 'in', input.fileIds)
                .where('uploaded_by', '=', ctx.id)
                .execute();

            if (files.length !== input.fileIds.length) {
                return {
                    status: false,
                    code: 400,
                    message: 'Some files do not exist'
                } satisfies ErrorApiResponse;
            }

            // Verify all files are images or videos
            const nonMedia = files.filter(
                (f) => !f.mime_type.startsWith('image/') && !f.mime_type.startsWith('video/')
            );
            if (nonMedia.length > 0) {
                return {
                    status: false,
                    code: 400,
                    message: 'All files must be images or videos'
                } satisfies ErrorApiResponse;
            }
        }

        const albumId = uuid();

        // Create album
        await conn
            .insertInto('albums')
            .values({
                id: albumId,
                name: input.name || null,
                created_by: ctx.id
            })
            .execute();

        // Add images to album if any
        if (input.fileIds.length > 0) {
            await conn
                .insertInto('album_images')
                .values(
                    input.fileIds.map((fileId, index) => ({
                        album_id: albumId,
                        file_id: fileId,
                        display_order: index
                    }))
                )
                .execute();
        }

        return {
            status: true,
            data: { id: albumId }
        } satisfies SuccessApiResponse<{ id: string }>;
    }),
    addFiles: authProcedure.POST.input(
        z.object({
            albumId: z.string(),
            fileIds: z.array(z.string()).min(1)
        })
    ).query(async ({ input, ctx }) => {
        const album = await conn
            .selectFrom('albums')
            .select(['id', 'created_by'])
            .where('id', '=', input.albumId)
            .executeTakeFirst();

        if (!album || album.created_by !== ctx.id) {
            return {
                status: false,
                code: 403,
                message: 'Album not found or unauthorized'
            } satisfies ErrorApiResponse;
        }

        const files = await conn
            .selectFrom('files')
            .select(['id', 'mime_type'])
            .where('id', 'in', input.fileIds)
            .where('uploaded_by', '=', ctx.id)
            .execute();

        if (files.length !== input.fileIds.length) {
            return {
                status: false,
                code: 400,
                message: 'Some files do not exist'
            } satisfies ErrorApiResponse;
        }

        const nonMedia = files.filter(
            (f) => !f.mime_type.startsWith('image/') && !f.mime_type.startsWith('video/')
        );
        if (nonMedia.length > 0) {
            return {
                status: false,
                code: 400,
                message: 'All files must be images or videos'
            } satisfies ErrorApiResponse;
        }

        const maxOrderResult = await conn
            .selectFrom('album_images')
            .select(({ fn }) => fn.max('display_order').as('max_order'))
            .where('album_id', '=', input.albumId)
            .executeTakeFirst();

        const maxOrder = Number(maxOrderResult?.max_order ?? -1);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            await conn
                .insertInto('album_images')
                .ignore()
                .values({
                    album_id: input.albumId,
                    file_id: file.id,
                    display_order: maxOrder + i + 1
                })
                .execute();
        }

        return { status: true } as const;
    }),
    get: procedure.POST.input(z.object({ id: z.string() })).query(async ({ input }) => {
        const album = await conn
            .selectFrom('albums')
            .selectAll()
            .where('id', '=', input.id)
            .executeTakeFirst();

        if (!album) {
            return {
                status: false,
                code: 404,
                message: 'Album not found'
            } satisfies ErrorApiResponse;
        }

        // Get all images in the album
        const images = await conn
            .selectFrom('album_images')
            .innerJoin('files', 'files.id', 'album_images.file_id')
            .select([
                'files.id',
                'files.original_name',
                'files.mime_type',
                'album_images.display_order'
            ])
            .where('album_images.album_id', '=', input.id)
            .orderBy('album_images.display_order', 'asc')
            .execute();

        return {
            status: true,
            data: {
                album,
                images
            }
        } satisfies SuccessApiResponse<{
            album: typeof album;
            images: typeof images;
        }>;
    }),
    list: authProcedure.GET.query(async ({ ctx }) => {
        const albums = await conn
            .selectFrom('albums')
            .selectAll()
            .where('created_by', '=', ctx.id)
            .orderBy('created_at', 'desc')
            .execute();

        // Get image counts for each album
        const albumsWithCounts = await Promise.all(
            albums.map(async (album) => {
                const count = await conn
                    .selectFrom('album_images')
                    .select(({ fn }) => fn.count('file_id').as('count'))
                    .where('album_id', '=', album.id)
                    .executeTakeFirst();

                return {
                    ...album,
                    imageCount: Number(count?.count || 0)
                };
            })
        );

        return {
            status: true,
            data: albumsWithCounts
        } satisfies SuccessApiResponse<typeof albumsWithCounts>;
    }),
    delete: authProcedure.POST.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
        const album = await conn
            .selectFrom('albums')
            .select(['id', 'created_by'])
            .where('id', '=', input.id)
            .executeTakeFirst();

        if (!album) {
            return {
                status: false,
                code: 404,
                message: 'Album not found'
            } satisfies ErrorApiResponse;
        }

        if (album.created_by !== ctx.id) {
            return {
                status: false,
                code: 403,
                message: 'Not authorized to delete this album'
            } satisfies ErrorApiResponse;
        }

        await conn.deleteFrom('albums').where('id', '=', input.id).execute();

        return {
            status: true
        } as const;
    }),
    reorder: authProcedure.POST.input(
        z.object({
            albumId: z.string(),
            fileIds: z.array(z.string())
        })
    ).query(async ({ input, ctx }) => {
        const album = await conn
            .selectFrom('albums')
            .select(['id', 'created_by'])
            .where('id', '=', input.albumId)
            .executeTakeFirst();

        if (!album || album.created_by !== ctx.id) {
            return {
                status: false,
                code: 403,
                message: 'Album not found or unauthorized'
            } satisfies ErrorApiResponse;
        }

        await conn.transaction().execute(async (trx) => {
            for (let i = 0; i < input.fileIds.length; i++) {
                await trx
                    .updateTable('album_images')
                    .set({ display_order: i })
                    .where('album_id', '=', input.albumId)
                    .where('file_id', '=', input.fileIds[i])
                    .execute();
            }
        });

        return { status: true } as const;
    })
};

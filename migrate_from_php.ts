import { config } from 'dotenv';
import fs from 'fs/promises';
import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { DB } from './src/types/database';

config();

const { DATABASE_IP, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME } = process.env;

if (!DATABASE_IP || !DATABASE_PORT || !DATABASE_USER || !DATABASE_PASSWORD || !DATABASE_NAME) {
    console.error('Missing database configuration in .env');
    process.exit(1);
}

const dialect = new MysqlDialect({
    pool: createPool({
        host: DATABASE_IP,
        port: parseInt(DATABASE_PORT),
        user: DATABASE_USER,
        password: DATABASE_PASSWORD,
        database: DATABASE_NAME
    })
});

const db = new Kysely<DB>({
    dialect
});

const args = process.argv.slice(2);
const sourceDir = args[0];
const userId = args[1] ? parseInt(args[1]) : null;

if (!sourceDir) {
    console.error('Usage: tsx migrate_from_php.ts <source_directory> [user_id]');
    process.exit(1);
}

const UPLOADS_DIR = path.resolve('uploads');

const MIME_TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg'
};

function getMimeType(ext: string): string {
    return MIME_TYPES[ext.toLowerCase()] || 'application/octet-stream';
}

async function migrate() {
    try {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });

        const files = await fs.readdir(sourceDir);
        console.log(`Found ${files.length} files in ${sourceDir}`);

        let count = 0;
        for (const file of files) {
            if (file.startsWith('.')) continue; // Skip hidden files

            const filePath = path.join(sourceDir, file);
            const stats = await fs.stat(filePath);

            if (stats.isDirectory()) continue;

            const ext = path.extname(file);
            const mimeType = getMimeType(ext);
            const id = uuidv4();
            const newFilename = `${id}${ext}`;
            const newPath = path.join(UPLOADS_DIR, newFilename);

            // Use mtime if birthtime is invalid (common on Linux)
            const createdAt = stats.birthtime.getTime() === 0 ? stats.mtime : stats.birthtime;

            console.log(
                `[${++count}/${files.length}] Migrating ${file} -> ${newFilename} (${mimeType})`
            );

            // Copy file instead of move to be safe
            await fs.copyFile(filePath, newPath);

            await db
                .insertInto('files')
                .values({
                    id,
                    original_name: file,
                    mime_type: mimeType,
                    size: stats.size,
                    uploaded_by: userId,
                    upload_date: createdAt
                })
                .execute();
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await db.destroy();
    }
}

migrate();

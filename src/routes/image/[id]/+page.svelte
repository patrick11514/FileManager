<script lang="ts">
    import { API } from '$/lib/api';
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    async function deleteFile() {
        if (confirm('Are you sure?')) {
            const res = await API.files.delete({ id: data.file.id });
            if (!res.status) {
                alert(res.message);
                return;
            }
            // eslint-disable-next-line svelte/no-navigation-without-resolve
            await goto('/images');
        }
    }

    function getExt(filename: string) {
        return filename.substring(filename.lastIndexOf('.'));
    }

    function formatSize(bytes: number) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
</script>

<div class="mx-auto max-w-4xl overflow-hidden rounded-lg bg-white shadow">
    <div class="p-6">
        <div class="mb-6 flex items-start justify-between">
            <h2 class="truncate text-2xl font-bold">{data.file.original_name}</h2>
            <button
                onclick={deleteFile}
                class="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
                Delete
            </button>
        </div>

        <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="flex justify-center rounded-lg bg-gray-100 p-4">
                <img
                    src="/raw/images/{data.file.id}{getExt(data.file.original_name)}"
                    alt={data.file.original_name}
                    class="max-h-125 object-contain"
                />
            </div>

            <div class="space-y-4">
                <h3 class="border-b pb-2 text-lg font-medium">Metadata</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div class="text-gray-500">Size</div>
                    <div class="font-medium">{formatSize(data.file.size)}</div>

                    <div class="text-gray-500">Type</div>
                    <div class="font-medium">{data.file.mime_type}</div>

                    <div class="text-gray-500">Uploaded</div>
                    <div class="font-medium">
                        {new Date(data.file.upload_date).toLocaleString()}
                    </div>

                    <div class="text-gray-500">ID</div>
                    <div class="font-mono text-xs font-medium">{data.file.id}</div>
                </div>
            </div>
        </div>
    </div>
</div>

<script lang="ts">
    import { API } from '$/lib/api';
    import { invalidateAll } from '$app/navigation';
    import { Button } from '$lib/components/ui/button/index.js';
    import * as Card from '$lib/components/ui/card/index.js';
    import Trash2 from '@lucide/svelte/icons/trash-2';
    import { toast } from 'svelte-sonner';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    async function deleteFile(id: string) {
        if (confirm('Are you sure?')) {
            const res = await API.files.delete({ id });
            if (!res.status) {
                toast.error(res.message);
                return;
            }
            toast.success('Video removed successfully');
            invalidateAll();
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

<h2 class="mb-6 text-2xl font-bold">Videos</h2>

<div class="space-y-4">
    {#each data.videos as video (video.id)}
        <Card.Root>
            <Card.Content class="flex items-center justify-between p-4">
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                        <!-- eslint-disable svelte/no-navigation-without-resolve -->
                        <a
                            href="/raw/video/{video.id}{getExt(video.original_name)}"
                            target="_blank"
                            class="truncate font-medium text-primary hover:underline"
                        >
                            {video.original_name}
                        </a>
                        <!-- eslint-enable svelte/no-navigation-without-resolve -->
                    </div>
                    <div class="mt-1 flex items-center text-sm text-muted-foreground">
                        <span>{formatSize(video.size)}</span>
                        <span class="mx-2">&middot;</span>
                        <span>{new Date(video.upload_date).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="ml-4 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onclick={(e) => {
                            e.preventDefault();
                            deleteFile(video.id);
                        }}
                        class="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive/90"
                    >
                        <Trash2 class="h-4 w-4" />
                    </Button>
                </div>
            </Card.Content>
        </Card.Root>
    {/each}
</div>

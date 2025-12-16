<script lang="ts">
    import { API } from '$/lib/api';
    import { invalidateAll } from '$app/navigation';
    import { Button } from '$lib/components/ui/button/index.js';
    import * as Card from '$lib/components/ui/card/index.js';
    import Trash2 from '@lucide/svelte/icons/trash-2';
    import { toast } from 'svelte-sonner';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    function deleteFile(id: string) {
        toast('Are you sure you want to delete this video?', {
            action: {
                label: 'Delete',
                onClick: async () => {
                    const res = await API.files.delete({ id });
                    if (!res.status) {
                        toast.error(res.message);
                        return;
                    }
                    toast.success('Video removed successfully');
                    invalidateAll();
                }
            },
            cancel: {
                label: 'Cancel',
                onClick: () => {}
            }
        });
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

{#if data.videos.length === 0}
    <Card.Root class="border-destructive/50 bg-destructive/10">
        <Card.Header>
            <Card.Title class="text-destructive">No videos uploaded</Card.Title>
        </Card.Header>
        <Card.Content>
            <p class="text-destructive-foreground">There are no videos uploaded yet.</p>
        </Card.Content>
    </Card.Root>
{:else}
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
                                class="font-medium text-primary hover:underline"
                            >
                                {video.original_name}
                            </a>
                            <!-- eslint-enable svelte/no-navigation-without-resolve -->
                        </div>
                        <div class="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatSize(video.size)}</span>
                            <span>{new Date(video.upload_date).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onclick={() => deleteFile(video.id)}>
                        <Trash2 class="h-4 w-4 text-destructive" />
                    </Button>
                </Card.Content>
            </Card.Root>
        {/each}
    </div>
{/if}

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
        toast('Are you sure you want to delete this image?', {
            action: {
                label: 'Delete',
                onClick: async () => {
                    const res = await API.files.delete({ id });
                    if (!res.status) {
                        toast.error(res.message);
                        return;
                    }
                    toast.success('Image removed successfully');
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
</script>

{#if data.images.length === 0}
    <Card.Root class="border-destructive/50 bg-destructive/10">
        <Card.Header>
            <Card.Title class="text-destructive">No images uploaded</Card.Title>
        </Card.Header>
        <Card.Content>
            <p class="text-destructive-foreground">There are no images uploaded yet.</p>
        </Card.Content>
    </Card.Root>
{:else}
    <div class="grid grid-cols-3 gap-4 md:grid-cols-6">
        {#each data.images as image (image.id)}
            <Card.Root class="overflow-hidden transition-shadow hover:shadow-md">
                <Card.Content class="p-0">
                    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                    <a href="/image/{image.id}" class="relative block aspect-square bg-muted">
                        <img
                            src="/raw/images/{image.id}{getExt(image.original_name)}?width=300"
                            alt={image.original_name}
                            class="h-full w-full object-cover"
                        />
                    </a>
                </Card.Content>
                <Card.Footer class="flex items-center justify-between p-2">
                    <span
                        class="max-w-37.5 truncate text-sm font-medium"
                        title={image.original_name}>{image.original_name}</span
                    >
                    <Button
                        variant="ghost"
                        size="icon"
                        onclick={(e) => {
                            e.preventDefault();
                            deleteFile(image.id);
                        }}
                        class="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive/90"
                    >
                        <Trash2 class="h-4 w-4" />
                    </Button>
                </Card.Footer>
            </Card.Root>
        {/each}
    </div>
{/if}

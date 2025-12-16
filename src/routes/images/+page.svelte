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
            toast.success('Image removed successfully');
            invalidateAll();
        }
    }

    function getExt(filename: string) {
        return filename.substring(filename.lastIndexOf('.'));
    }
</script>

<h2 class="mb-6 text-2xl font-bold">Images</h2>

<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
    {#each data.images as image}
        <Card.Root class="overflow-hidden transition-shadow hover:shadow-md">
            <Card.Content class="p-0">
                <a href="/image/{image.id}" class="relative block aspect-square bg-muted">
                    <img
                        src="/raw/images/{image.id}{getExt(image.original_name)}?width=300"
                        alt={image.original_name}
                        class="h-full w-full object-cover"
                    />
                </a>
            </Card.Content>
            <Card.Footer class="flex items-center justify-between p-2">
                <span class="max-w-37.5 truncate text-sm font-medium" title={image.original_name}
                    >{image.original_name}</span
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

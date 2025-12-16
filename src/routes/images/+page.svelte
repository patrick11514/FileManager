<script lang="ts">
    import { API } from '$/lib/api';
    import { resolve } from '$app/paths';
    import { Button } from '$lib/components/ui/button/index.js';
    import * as Card from '$lib/components/ui/card/index.js';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
    import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
    import Trash2 from '@lucide/svelte/icons/trash-2';
    import { toast } from 'svelte-sonner';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    let images = $derived(data.images);
    let offset = $derived(data.images.length);
    let loading = $state(false);
    let orderBy = $state<'upload_date' | 'original_name' | 'size'>('upload_date');
    let orderDir = $state<'asc' | 'desc'>('desc');
    let hasMore = $state(true);

    $effect(() => {
        images = data.images;
        offset = data.images.length;
        hasMore = data.images.length === 40;
    });

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
                    // Remove from local state instead of invalidating all to keep scroll position
                    images = images.filter((i) => i.id !== id);
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

    async function loadMore() {
        if (loading || !hasMore) return;
        loading = true;
        const res = await API.files.list({
            limit: 40,
            offset,
            type: 'image',
            orderBy,
            orderDir
        });
        if (res.status) {
            if (res.data.length < 40) hasMore = false;
            images = [...images, ...res.data];
            offset += res.data.length;
        }
        loading = false;
    }

    async function sort(by: 'upload_date' | 'original_name' | 'size', dir: 'asc' | 'desc') {
        orderBy = by;
        orderDir = dir;
        offset = 0;
        hasMore = true;
        loading = true;
        const res = await API.files.list({
            limit: 40,
            offset: 0,
            type: 'image',
            orderBy,
            orderDir
        });
        if (res.status) {
            images = res.data;
            offset = res.data.length;
            if (res.data.length < 40) hasMore = false;
        }
        loading = false;
    }

    function handleScroll(e: Event) {
        const target = e.target as HTMLDivElement;
        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
            loadMore();
        }
    }
</script>

<div class="flex h-[calc(100vh-4.1rem)] flex-col gap-4 p-4">
    <div class="flex items-center justify-between">
        <DropdownMenu.Root>
            <DropdownMenu.Trigger class="ml-auto">
                {#snippet child({ props })}
                    <Button variant="outline" size="sm" {...props}>
                        <ArrowUpDown class="mr-2 h-4 w-4" />
                        Sort by
                    </Button>
                {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
                <DropdownMenu.Label>Sort by</DropdownMenu.Label>
                <DropdownMenu.Separator />
                <DropdownMenu.Item onclick={() => sort('upload_date', 'desc')}>
                    Date (Newest)
                </DropdownMenu.Item>
                <DropdownMenu.Item onclick={() => sort('upload_date', 'asc')}>
                    Date (Oldest)
                </DropdownMenu.Item>
                <DropdownMenu.Item onclick={() => sort('original_name', 'asc')}>
                    Name (A-Z)
                </DropdownMenu.Item>
                <DropdownMenu.Item onclick={() => sort('original_name', 'desc')}>
                    Name (Z-A)
                </DropdownMenu.Item>
                <DropdownMenu.Item onclick={() => sort('size', 'desc')}>
                    Size (Largest)
                </DropdownMenu.Item>
                <DropdownMenu.Item onclick={() => sort('size', 'asc')}>
                    Size (Smallest)
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </div>

    <div class="flex-1 overflow-y-auto" onscroll={handleScroll}>
        {#if images.length === 0}
            <Card.Root class="border-destructive/50 bg-destructive/10">
                <Card.Header>
                    <Card.Title class="text-destructive">No images uploaded</Card.Title>
                </Card.Header>
                <Card.Content>
                    <p class="text-destructive-foreground">There are no images uploaded yet.</p>
                </Card.Content>
            </Card.Root>
        {:else}
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                {#each images as image (image.id)}
                    <Card.Root class="overflow-hidden transition-shadow hover:shadow-md">
                        <Card.Content class="p-0">
                            <a
                                href={resolve(`/image/${image.id}`)}
                                class="relative block aspect-square bg-muted"
                            >
                                <img
                                    src="/raw/images/{image.id}{getExt(
                                        image.original_name
                                    )}?width=300"
                                    alt={image.original_name}
                                    class="h-full w-full object-cover"
                                    loading="lazy"
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
            {#if loading}
                <div class="py-4 text-center text-sm text-muted-foreground">Loading more...</div>
            {/if}
        {/if}
    </div>
</div>

<script lang="ts">
    import { resolve } from '$app/paths';
    import * as Card from '$lib/components/ui/card/index.js';
    import CirclePlay from '@lucide/svelte/icons/circle-play';
    import Pencil from '@lucide/svelte/icons/pencil';
    import Check from '@lucide/svelte/icons/check';
    import X from '@lucide/svelte/icons/x';
    import GripVertical from '@lucide/svelte/icons/grip-vertical';
    import { Button } from '$lib/components/ui/button/index.js';
    import { API } from '$/lib/api';
    import { toast } from 'svelte-sonner';
    import { invalidateAll } from '$app/navigation';
    import { flip } from 'svelte/animate';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    const album = $derived(data.album);

    let isEditing = $state(false);
    let orderedImages = $state<typeof data.images>([]);
    let isSaving = $state(false);

    $effect(() => {
        if (!isEditing) {
            orderedImages = [...data.images];
        }
    });

    const isOwner = $derived(data.user?.id === album.created_by);

    let draggedIndex = $state<number | null>(null);
    let dragOverIndex = $state<number | null>(null);

    function getExt(filename: string) {
        return filename.substring(filename.lastIndexOf('.'));
    }

    function formatDate(date: Date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function handleDragStart(e: DragEvent, index: number) {
        if (!isEditing) return;
        draggedIndex = index;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index.toString());
        }
    }

    function handleDragOver(e: DragEvent, index: number) {
        if (!isEditing || draggedIndex === null) return;
        e.preventDefault();
        if (draggedIndex === index) return;
        dragOverIndex = index;
    }

    function handleDrop(e: DragEvent, index: number) {
        if (!isEditing || draggedIndex === null) return;
        e.preventDefault();

        if (draggedIndex !== index) {
            const items = [...orderedImages];
            const [draggedItem] = items.splice(draggedIndex, 1);
            items.splice(index, 0, draggedItem);
            orderedImages = items;
        }

        draggedIndex = null;
        dragOverIndex = null;
    }

    function handleDragEnd() {
        draggedIndex = null;
        dragOverIndex = null;
    }

    async function saveOrder() {
        isSaving = true;
        const res = await API.albums.reorder({
            albumId: album.id,
            fileIds: orderedImages.map((i) => i.id)
        });
        isSaving = false;

        if (res.status) {
            toast.success('Album order saved successfully');
            isEditing = false;
            await invalidateAll();
        } else {
            toast.error(res.message || 'Failed to save album order');
        }
    }

    function cancelEdit() {
        isEditing = false;
        orderedImages = [...data.images];
    }
</script>

<svelte:head>
    <title>{album.name || 'Album'} | Uploader</title>
</svelte:head>

<div class="container mx-auto max-w-7xl p-4">
    <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
            {#if album.name}
                <h1 class="text-3xl font-bold">{album.name}</h1>
            {/if}
            <p class="text-muted-foreground">
                Created on {formatDate(album.created_at)}
            </p>
        </div>
        {#if isOwner}
            <div class="flex items-center gap-2">
                {#if isEditing}
                    <Button variant="outline" size="sm" onclick={cancelEdit} disabled={isSaving}>
                        <X class="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                    <Button variant="default" size="sm" onclick={saveOrder} disabled={isSaving}>
                        <Check class="mr-2 h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Order'}
                    </Button>
                {:else}
                    <Button variant="outline" size="sm" onclick={() => (isEditing = true)}>
                        <Pencil class="mr-2 h-4 w-4" />
                        Edit Order
                    </Button>
                {/if}
            </div>
        {/if}
    </div>

    {#if isEditing}
        <div
            class="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary"
        >
            <GripVertical class="h-4 w-4 shrink-0" />
            <span>Drag and drop the cards below to reorder items in the album.</span>
        </div>
    {/if}

    {#if orderedImages.length === 0}
        <Card.Root class="border-destructive/50 bg-destructive/10">
            <Card.Header>
                <Card.Title class="text-destructive">No images in album</Card.Title>
            </Card.Header>
            <Card.Content>
                <p class="text-destructive-foreground">This album is empty.</p>
            </Card.Content>
        </Card.Root>
    {:else}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {#each orderedImages as image, index (image.id)}
                {@const isVideo = image.mime_type.startsWith('video/')}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    animate:flip={{ duration: 250 }}
                    draggable={isEditing}
                    ondragstart={(e) => handleDragStart(e, index)}
                    ondragover={(e) => handleDragOver(e, index)}
                    ondrop={(e) => handleDrop(e, index)}
                    ondragend={handleDragEnd}
                    class="group relative aspect-square overflow-hidden rounded-lg bg-muted transition-all duration-200
                           {isEditing
                        ? 'cursor-grab border-2 border-transparent active:cursor-grabbing'
                        : 'hover:scale-105'}
                           {isEditing && draggedIndex === index ? 'scale-95 opacity-40' : ''}
                           {isEditing && dragOverIndex === index && draggedIndex !== index
                        ? 'scale-105 border-dashed border-primary shadow-lg'
                        : ''}"
                >
                    <img
                        src="/raw/images/{image.id}{getExt(image.original_name)}?width=400"
                        alt={image.original_name}
                        class="pointer-events-none h-full w-full object-cover select-none"
                        loading="lazy"
                    />

                    {#if isVideo}
                        <div
                            class="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/40"
                        >
                            <CirclePlay class="h-12 w-12 text-white/80" />
                        </div>
                    {/if}

                    {#if isEditing}
                        <!-- Premium drag handle overlay -->
                        <div
                            class="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white shadow-md transition-opacity"
                        >
                            <GripVertical class="h-4 w-4" />
                        </div>
                    {/if}

                    {#if !isEditing}
                        <a
                            href={resolve(
                                `/raw/${isVideo ? 'videos' : 'images'}/${image.id}${getExt(image.original_name)}`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="absolute inset-0 z-10"
                        >
                            <span class="sr-only">View full media</span>
                        </a>
                    {/if}

                    <div
                        class="absolute right-0 bottom-0 left-0 bg-black/60 p-2 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                        <p class="truncate" title={image.original_name}>{image.original_name}</p>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

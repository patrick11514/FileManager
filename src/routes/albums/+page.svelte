<script lang="ts">
    import { API } from '$/lib/api';
    import { invalidate } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { Button } from '$lib/components/ui/button/index.js';
    import * as Card from '$lib/components/ui/card/index.js';
    import { Badge } from '$lib/components/ui/badge/index.js';
    import ImageIcon from '@lucide/svelte/icons/image';
    import Link from '@lucide/svelte/icons/link';
    import Trash2 from '@lucide/svelte/icons/trash-2';
    import { toast } from 'svelte-sonner';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    let albums = $derived(data.albums);

    function formatDate(date: Date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    async function copyAlbumLink(albumId: string) {
        const albumUrl = `${window.location.origin}/album/${albumId}`;
        try {
            await navigator.clipboard.writeText(albumUrl);
            toast.success('Album link copied to clipboard!');
        } catch {
            toast.info(`Album URL: ${albumUrl}`);
        }
    }

    function deleteAlbum(id: string) {
        toast('Are you sure you want to delete this album?', {
            action: {
                label: 'Delete',
                onClick: async () => {
                    const res = await API.albums.delete({ id });
                    if (!res.status) {
                        toast.error(res.message);
                        return;
                    }
                    toast.success('Album deleted successfully');
                    // Reload the page data to reflect the deletion
                    await invalidate(() => true);
                }
            },
            cancel: {
                label: 'Cancel',
                onClick: () => {}
            }
        });
    }
</script>

<div class="flex h-[calc(100vh-4.1rem)] flex-col gap-4 p-4">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">My Albums</h1>
    </div>

    <div class="flex-1 overflow-y-auto">
        {#if albums.length === 0}
            <Card.Root class="border-muted">
                <Card.Header>
                    <Card.Title>No albums yet</Card.Title>
                </Card.Header>
                <Card.Content>
                    <p class="text-muted-foreground">
                        Go to the Images page to create your first album by selecting images.
                    </p>
                </Card.Content>
            </Card.Root>
        {:else}
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {#each albums as album (album.id)}
                    <Card.Root class="overflow-hidden transition-shadow hover:shadow-md">
                        <Card.Header>
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <Card.Title class="text-lg">
                                        {album.name || 'Untitled Album'}
                                    </Card.Title>
                                    <Card.Description>
                                        Created {formatDate(album.created_at)}
                                    </Card.Description>
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Content>
                            <div class="flex items-center gap-2">
                                <Badge variant="secondary">
                                    <ImageIcon class="mr-1 h-3 w-3" />
                                    {album.imageCount}
                                    {album.imageCount === 1 ? 'image' : 'images'}
                                </Badge>
                            </div>
                        </Card.Content>
                        <Card.Footer class="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onclick={() => window.open(resolve(`/album/${album.id}`), '_blank')}
                                class="flex-1"
                            >
                                View Album
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onclick={() => copyAlbumLink(album.id)}
                                class="h-9 w-9"
                            >
                                <Link class="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onclick={() => deleteAlbum(album.id)}
                                class="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive/90"
                            >
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        </Card.Footer>
                    </Card.Root>
                {/each}
            </div>
        {/if}
    </div>
</div>

<script lang="ts">
    import { API } from '$/lib/api';
    import { invalidateAll } from '$app/navigation';
    import { Button } from '$lib/components/ui/button/index.js';
    import * as Card from '$lib/components/ui/card/index.js';
    import * as Table from '$lib/components/ui/table/index.js';
    import FileText from '@lucide/svelte/icons/file-text';
    import Trash2 from '@lucide/svelte/icons/trash-2';
    import { toast } from 'svelte-sonner';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    function deleteFile(id: string) {
        toast('Are you sure you want to delete this file?', {
            action: {
                label: 'Delete',
                onClick: async () => {
                    const res = await API.files.delete({ id });
                    if (!res.status) {
                        toast.error(res.message);
                        return;
                    }
                    toast.success('File removed successfully');
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

{#if data.files.length === 0}
    <Card.Root class="border-destructive/50 bg-destructive/10">
        <Card.Header>
            <Card.Title class="text-destructive">No files uploaded</Card.Title>
        </Card.Header>
        <Card.Content>
            <p class="text-destructive-foreground">There are no files uploaded yet.</p>
        </Card.Content>
    </Card.Root>
{:else}
    <Card.Root>
        <Card.Content class="p-0">
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Name</Table.Head>
                        <Table.Head>Size</Table.Head>
                        <Table.Head>Date</Table.Head>
                        <Table.Head class="text-right">Actions</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each data.files as file (file.id)}
                        <Table.Row>
                            <Table.Cell class="font-medium">
                                <div class="flex items-center gap-2">
                                    <FileText class="h-4 w-4 text-muted-foreground" />
                                    <!-- eslint-disable svelte/no-navigation-without-resolve -->
                                    <a
                                        href="/raw/file/{file.id}{getExt(file.original_name)}"
                                        target="_blank"
                                        class="text-primary hover:underline"
                                    >
                                        {file.original_name}
                                    </a>
                                    <!-- eslint-enable svelte/no-navigation-without-resolve -->
                                </div>
                            </Table.Cell>
                            <Table.Cell>{formatSize(file.size)}</Table.Cell>
                            <Table.Cell
                                >{new Date(file.upload_date).toLocaleDateString()}</Table.Cell
                            >
                            <Table.Cell class="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onclick={() => deleteFile(file.id)}
                                >
                                    <Trash2 class="h-4 w-4 text-destructive" />
                                </Button>
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                </Table.Body>
            </Table.Root>
        </Card.Content>
    </Card.Root>
{/if}

<script lang="ts">
    import { API } from '$/lib/api';
    import { invalidateAll } from '$app/navigation';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import * as Table from '$lib/components/ui/table';
    import Trash from '@lucide/svelte/icons/trash';
    import { onMount } from 'svelte';
    import { toast } from 'svelte-sonner';

    let keys = $state<{ id: number; name: string; created_at: Date }[]>([]);
    let newKeyName = $state('');

    async function loadKeys() {
        const res = await API.apiKeys.list();
        if (res.status) {
            keys = res.data;
        }
    }

    async function createKey() {
        if (!newKeyName) return;
        const res = await API.apiKeys.create({ name: newKeyName });
        if (res.status) {
            toast.success('API Key created', {
                description: res.data,
                duration: 30000,
                action: {
                    label: 'Copy',
                    onClick: () => navigator.clipboard.writeText(res.data)
                }
            });
            newKeyName = '';
            loadKeys();
        } else {
            toast.error('Failed to create API key');
        }
    }

    async function deleteKey(id: number) {
        toast('Are you sure you want to delete this API key?', {
            action: {
                label: 'Delete',
                onClick: async () => {
                    const res = await API.apiKeys.delete({ id });
                    if (!res.status) {
                        return;
                    }
                    toast.success('API Key deleted successfully');
                    invalidateAll();
                }
            },
            cancel: {
                label: 'Cancel',
                onClick: () => {}
            }
        });
    }

    onMount(() => {
        loadKeys();
    });
</script>

<div class="p-6">
    <h1 class="mb-4 text-2xl font-bold">Settings</h1>

    <div class="mb-8">
        <h2 class="mb-2 text-xl font-semibold">Create API Key</h2>
        <div class="flex items-end gap-4">
            <div class="grid w-full max-w-sm items-center gap-1.5">
                <Label for="name">Name</Label>
                <Input type="text" id="name" placeholder="My API Key" bind:value={newKeyName} />
            </div>
            <Button onclick={createKey} disabled={!newKeyName}>Create</Button>
        </div>
    </div>

    <div>
        <h2 class="mb-2 text-xl font-semibold">API Keys</h2>
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head>Name</Table.Head>
                    <Table.Head>Created At</Table.Head>
                    <Table.Head class="w-25">Action</Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each keys as key (key.id)}
                    <Table.Row>
                        <Table.Cell>{key.name}</Table.Cell>
                        <Table.Cell>{new Date(key.created_at).toLocaleString()}</Table.Cell>
                        <Table.Cell>
                            <Button
                                variant="destructive"
                                size="icon"
                                onclick={() => deleteKey(key.id)}
                            >
                                <Trash class="h-4 w-4" />
                            </Button>
                        </Table.Cell>
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>
    </div>
</div>

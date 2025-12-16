<script lang="ts">
    import { API } from '$/lib/api';
    import { invalidateAll } from '$app/navigation';
    import { Button } from '$lib/components/ui/button/index.js';
    import * as Card from '$lib/components/ui/card/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import { Label } from '$lib/components/ui/label/index.js';
    import * as Table from '$lib/components/ui/table/index.js';
    import Trash2 from '@lucide/svelte/icons/trash-2';
    import { toast } from 'svelte-sonner';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    let username = $state('');
    let password = $state('');
    let error = $state('');

    async function createUser() {
        try {
            const res = await API.users.create({ username, password });
            if (!res.status) {
                toast.error(res.message);
                return;
            }
            username = '';
            password = '';
            error = '';
            toast.success('User created successfully');
            invalidateAll();
        } catch (e) {
            if (e instanceof Error) {
                toast.error(e.message);
            } else {
                toast.error('Failed to create user');
            }
        }
    }

    function deleteUser(id: number) {
        toast('Are you sure you want to delete this user?', {
            action: {
                label: 'Delete',
                onClick: async () => {
                    const res = await API.users.delete({ id });
                    if (!res.status) {
                        toast.error(res.message);
                        return;
                    }
                    toast.success('User deleted successfully');
                    invalidateAll();
                }
            },
            cancel: {
                label: 'Cancel',
                onClick: () => {}
            }
        });
    }
</script>

<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
    <Card.Root>
        <Card.Header>
            <Card.Title>Create User</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
            <div class="space-y-2">
                <Label for="username">Username</Label>
                <Input id="username" bind:value={username} type="text" />
            </div>
            <div class="space-y-2">
                <Label for="password">Password</Label>
                <Input id="password" bind:value={password} type="password" />
            </div>
            {#if error}
                <p class="text-sm text-destructive">{error}</p>
            {/if}
        </Card.Content>
        <Card.Footer>
            <Button class="w-full" onclick={createUser}>Create User</Button>
        </Card.Footer>
    </Card.Root>

    <Card.Root>
        <Card.Header>
            <Card.Title>Existing Users</Card.Title>
        </Card.Header>
        <Card.Content>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Username</Table.Head>
                        <Table.Head class="text-right">ID</Table.Head>
                        <Table.Head class="text-right">Actions</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each data.users as user (user.id)}
                        <Table.Row>
                            <Table.Cell class="font-medium">{user.username}</Table.Cell>
                            <Table.Cell class="text-right">{user.id}</Table.Cell>
                            <Table.Cell class="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onclick={() => deleteUser(user.id)}
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
</div>

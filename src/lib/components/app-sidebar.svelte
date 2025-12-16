<script lang="ts">
    import { page } from '$app/stores';
    import * as Sidebar from '$lib/components/ui/sidebar/index.js';
    import FileText from '@lucide/svelte/icons/file-text';
    import House from '@lucide/svelte/icons/house';
    import Image from '@lucide/svelte/icons/image';
    import Users from '@lucide/svelte/icons/users';
    import Video from '@lucide/svelte/icons/video';

    let { user }: { user: { username: string } } = $props();

    const items = [
        {
            title: 'Dashboard',
            url: '/',
            icon: House
        },
        {
            title: 'Files',
            url: '/files',
            icon: FileText
        },
        {
            title: 'Images',
            url: '/images',
            icon: Image
        },
        {
            title: 'Videos',
            url: '/videos',
            icon: Video
        },
        {
            title: 'Users',
            url: '/users',
            icon: Users
        }
    ];
</script>

<Sidebar.Root>
    <Sidebar.Header>
        <div class="flex flex-col px-4 py-2">
            <h1 class="text-lg font-semibold">File Manager</h1>
            <span class="text-sm text-muted-foreground">Welcome, {user.username}</span>
        </div>
    </Sidebar.Header>
    <Sidebar.Content>
        <Sidebar.Group>
            <Sidebar.GroupLabel>Application</Sidebar.GroupLabel>
            <Sidebar.GroupContent>
                <Sidebar.Menu>
                    {#each items as item (item.title)}
                        <Sidebar.MenuItem>
                            <Sidebar.MenuButton isActive={$page.url.pathname === item.url}>
                                {#snippet child({ props })}
                                    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                                    <a href={item.url} {...props}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </a>
                                {/snippet}
                            </Sidebar.MenuButton>
                        </Sidebar.MenuItem>
                    {/each}
                </Sidebar.Menu>
            </Sidebar.GroupContent>
        </Sidebar.Group>
    </Sidebar.Content>
</Sidebar.Root>

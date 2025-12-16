<script lang="ts">
    import { API } from '$/lib/api';
    import { goto } from '$app/navigation';
    import { Button } from '$lib/components/ui/button/index.js';
    import * as Card from '$lib/components/ui/card/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import { Label } from '$lib/components/ui/label/index.js';

    let username = $state('');
    let password = $state('');
    let error = $state('');

    async function login() {
        try {
            const res = await API.auth.login({ username, password });
            if (!res.status) {
                error = res.message;
                return;
            }
            goto('/');
        } catch (e: any) {
            error = e.message || 'Login failed';
        }
    }
</script>

<div class="flex h-screen items-center justify-center bg-background">
    <Card.Root class="w-full max-w-md">
        <Card.Header>
            <Card.Title class="text-center text-2xl">Login</Card.Title>
            <Card.Description class="text-center"
                >Enter your credentials to access the file manager</Card.Description
            >
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
            <Button class="w-full" onclick={login}>Sign In</Button>
        </Card.Footer>
    </Card.Root>
</div>

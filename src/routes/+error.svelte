<script lang="ts">
    import { resolve } from '$app/paths';
    import { page } from '$app/state';
    import { Button } from '$lib/components/ui/button/index.js';
    import * as Card from '$lib/components/ui/card/index.js';
</script>

<div class="flex h-screen min-h-screen items-center justify-center p-4">
    <Card.Root class="w-full max-w-md text-center">
        <Card.Header>
            <div class="mb-4 flex justify-center">
                <img
                    src="https://httpcats.com/{page.status}.jpg"
                    alt="Error {page.status}"
                    class="h-auto w-full max-w-75 rounded-lg object-cover"
                />
            </div>
            <Card.Title class="text-2xl font-bold">Error {page.status}</Card.Title>
            <Card.Description class="text-lg">
                {page.error?.message || 'Something went wrong'}
            </Card.Description>
        </Card.Header>
        <Card.Footer class="flex justify-center">
            <Button href={resolve('/')}>Go Home</Button>
        </Card.Footer>
    </Card.Root>
</div>

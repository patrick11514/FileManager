<script lang="ts">
    import { API } from '$/lib/api';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { Button } from '$lib/components/ui/button/index.js';
    import * as Card from '$lib/components/ui/card/index.js';
    import ArrowLeft from '@lucide/svelte/icons/arrow-left';
    import Trash2 from '@lucide/svelte/icons/trash-2';
    import { toast } from 'svelte-sonner';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    function deleteFile() {
        toast('Are you sure you want to delete this image?', {
            action: {
                label: 'Delete',
                onClick: async () => {
                    const res = await API.files.delete({ id: data.file.id });
                    if (!res.status) {
                        toast.error(res.message);
                        return;
                    }
                    await goto(resolve('/images'));
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

<div class="flex h-full flex-col items-center justify-center gap-4 p-4">
    <div class="flex w-full max-w-4xl justify-start">
        <Button
            href={resolve('/images')}
            onclick={(e) => {
                e.preventDefault();
                history.back();
            }}
            variant="ghost"
            size="sm"
            class="gap-2"
        >
            <ArrowLeft class="size-4" />
            Back to Images
        </Button>
    </div>
    <Card.Root class="w-full max-w-4xl">
        <Card.Content class="p-6">
            <div class="flex flex-col items-center gap-6">
                <img
                    src="/raw/images/{data.file.id}{getExt(data.file.original_name)}"
                    alt={data.file.original_name}
                    class="max-h-[70vh] w-full rounded-md object-contain"
                />
                <div class="flex w-full items-center justify-between">
                    <div class="flex flex-col">
                        <h2 class="text-xl font-semibold">{data.file.original_name}</h2>
                        <p class="text-sm text-muted-foreground">
                            {formatSize(data.file.size)} • {new Date(
                                data.file.upload_date
                            ).toLocaleDateString()}
                        </p>
                    </div>
                    <div class="flex gap-2">
                        <Button variant="destructive" size="icon" onclick={deleteFile}>
                            <Trash2 class="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </Card.Content>
    </Card.Root>
</div>

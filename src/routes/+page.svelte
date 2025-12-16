<script lang="ts">
    import { API } from '$/lib/api';
    import { invalidateAll } from '$app/navigation';
    import * as Card from '$lib/components/ui/card/index.js';
    import UploadCloud from '@lucide/svelte/icons/cloud-upload';
    import { toast } from 'svelte-sonner';

    let dragging = $state(false);
    let uploading = $state(false);

    function handleDragEnter(e: DragEvent) {
        e.preventDefault();
        dragging = true;
    }

    function handleDragLeave(e: DragEvent) {
        e.preventDefault();
        dragging = false;
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
    }

    async function handleDrop(e: DragEvent) {
        e.preventDefault();
        dragging = false;
        if (e.dataTransfer?.files) {
            await uploadFiles(e.dataTransfer.files);
        }
    }

    async function handleFileSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files) {
            await uploadFiles(target.files);
        }
    }

    async function uploadFiles(files: FileList) {
        uploading = true;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await API.files.upload(formData);
                if (!res.status) {
                    toast.error(`Upload failed for ${file.name}: ${res.message}`);
                } else {
                    toast.success(`File ${file.name} uploaded successfully`);
                }
            } catch (e) {
                console.error('Upload failed', e);
                toast.error(`Upload failed for ${file.name}`);
            }
        }
        uploading = false;
        invalidateAll(); // Refresh lists
    }
</script>

<div class="space-y-6">
    <h2 class="text-2xl font-bold">Dashboard</h2>

    <Card.Root>
        <Card.Content class="p-6">
            <div
                class="cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors
                {dragging
                    ? 'border-primary bg-primary/10'
                    : 'border-muted-foreground/25 hover:border-primary/50'}"
                ondragenter={handleDragEnter}
                ondragleave={handleDragLeave}
                ondragover={handleDragOver}
                ondrop={handleDrop}
                onclick={() => document.getElementById('fileInput')?.click()}
                role="button"
                tabindex="0"
                onkeydown={(e) =>
                    e.key === 'Enter' && document.getElementById('fileInput')?.click()}
            >
                <input
                    type="file"
                    id="fileInput"
                    class="hidden"
                    multiple
                    onchange={handleFileSelect}
                />
                <div class="flex flex-col items-center space-y-2">
                    <UploadCloud class="h-12 w-12 text-muted-foreground" />
                    <div class="text-sm text-muted-foreground">
                        <span class="font-medium text-primary hover:text-primary/80"
                            >Upload a file</span
                        >
                        or drag and drop
                    </div>
                    <p class="text-xs text-muted-foreground">PNG, JPG, GIF, MP4, PDF up to 10MB</p>
                </div>
            </div>
        </Card.Content>
    </Card.Root>

    {#if uploading}
        <div class="text-center text-primary">Uploading...</div>
    {/if}
</div>

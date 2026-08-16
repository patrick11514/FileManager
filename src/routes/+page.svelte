<script lang="ts">
    import { API } from '$/lib/api';
    import { invalidateAll } from '$app/navigation';
    import { Badge } from '$lib/components/ui/badge/index.js';
    import { Button } from '$lib/components/ui/button/index.js';
    import * as Card from '$lib/components/ui/card/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import UploadCloud from '@lucide/svelte/icons/cloud-upload';
    import FolderIcon from '@lucide/svelte/icons/folder';
    import HardDrive from '@lucide/svelte/icons/hard-drive';
    import ImagesIcon from '@lucide/svelte/icons/images';
    import Plus from '@lucide/svelte/icons/plus';
    import X from '@lucide/svelte/icons/x';
    import { toast } from 'svelte-sonner';
    import { v4 as uuidv4 } from 'uuid';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    type TargetType = 'root' | 'folder' | 'album';
    type SubMode = 'existing' | 'new';

    let targetType = $state<TargetType>('root');
    let folderMode = $state<SubMode>('existing');
    let albumMode = $state<SubMode>('existing');

    let selectedFolderId = $state<string>('');
    let newFolderName = $state<string>('');

    let selectedAlbumId = $state<string>('');
    let newAlbumName = $state<string>('');

    let dragging = $state(false);
    let uploading = $state(false);

    type FileStatus = 'pending' | 'uploading' | 'success' | 'error';
    interface FileUpload {
        id: string;
        name: string;
        status: FileStatus;
        message?: string;
    }

    let uploads = $state<FileUpload[]>([]);

    let folders = $derived(data.folders ?? []);
    let albums = $derived(data.albums ?? []);

    // If folders exist and none is selected, auto-select the first one
    $effect(() => {
        if (targetType === 'folder') {
            if (folders.length > 0 && !selectedFolderId) {
                selectedFolderId = folders[0].id;
            } else if (folders.length === 0) {
                folderMode = 'new';
            }
        }
    });

    // If albums exist and none is selected, auto-select the first one
    $effect(() => {
        if (targetType === 'album') {
            if (albums.length > 0 && !selectedAlbumId) {
                selectedAlbumId = albums[0].id;
            } else if (albums.length === 0) {
                albumMode = 'new';
            }
        }
    });

    const activeTargetDescription = $derived.by(() => {
        if (targetType === 'folder') {
            if (folderMode === 'new') {
                return newFolderName.trim()
                    ? `New Folder: ${newFolderName.trim()}`
                    : 'New Folder (unnamed)';
            }
            const found = folders.find((f) => f.id === selectedFolderId);
            return found ? `Folder: ${found.name}` : 'Folder';
        }
        if (targetType === 'album') {
            if (albumMode === 'new') {
                return newAlbumName.trim()
                    ? `New Album: ${newAlbumName.trim()}`
                    : 'New Album (unnamed)';
            }
            const found = albums.find((a) => a.id === selectedAlbumId);
            return found ? `Album: ${found.name || 'Unnamed Album'}` : 'Album';
        }
        return 'General / Root Storage';
    });

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
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            await uploadFiles(e.dataTransfer.files);
        }
    }

    async function handleFileSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            await uploadFiles(target.files);
            target.value = '';
        }
    }

    async function handlePaste(e: ClipboardEvent) {
        const target = e.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            return;
        }

        if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
            e.preventDefault();
            await uploadFiles(e.clipboardData.files);
        }
    }

    function updateUploadStatus(id: string, status: FileStatus, message?: string) {
        uploads = uploads.map((u) => (u.id === id ? { ...u, status, message } : u));
    }

    function removeUpload(id: string) {
        uploads = uploads.filter((u) => u.id !== id);
    }

    function resetTarget() {
        targetType = 'root';
        newFolderName = '';
        newAlbumName = '';
    }

    async function uploadFiles(files: FileList) {
        if (files.length === 0) return;

        let targetFolderId: string | null = null;
        let targetAlbumId: string | null = null;

        // Validation and creation for Folder target
        if (targetType === 'folder') {
            if (folderMode === 'new') {
                const name = newFolderName.trim();
                if (!name) {
                    toast.error('Please enter a folder name before uploading');
                    return;
                }
                const res = await API.folders.create({ name });
                if (!res.status) {
                    toast.error(`Failed to create folder: ${res.message}`);
                    return;
                }
                targetFolderId = res.data.id;
                selectedFolderId = targetFolderId;
                folderMode = 'existing';
                newFolderName = '';
            } else {
                if (!selectedFolderId) {
                    toast.error('Please select a folder');
                    return;
                }
                targetFolderId = selectedFolderId;
            }
        }

        // Validation and creation for Album target
        if (targetType === 'album') {
            const nonMediaFiles = Array.from(files).filter(
                (f) => !f.type.startsWith('image/') && !f.type.startsWith('video/')
            );
            if (nonMediaFiles.length > 0) {
                toast.error(
                    `Albums only accept images and videos. ${nonMediaFiles.length} non-media file(s) skipped.`
                );
            }

            if (albumMode === 'new') {
                const name = newAlbumName.trim() || undefined;
                const res = await API.albums.create({ name, fileIds: [] });
                if (!res.status) {
                    toast.error(`Failed to create album: ${res.message}`);
                    return;
                }
                targetAlbumId = res.data.id;
                selectedAlbumId = targetAlbumId;
                albumMode = 'existing';
                newAlbumName = '';
            } else {
                if (!selectedAlbumId) {
                    toast.error('Please select an album');
                    return;
                }
                targetAlbumId = selectedAlbumId;
            }
        }

        uploading = true;

        const newUploads: FileUpload[] = Array.from(files).map((file) => ({
            id: uuidv4(),
            name: file.name,
            status: 'pending'
        }));

        uploads = [...uploads, ...newUploads];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const uploadId = newUploads[i].id;

            if (
                targetType === 'album' &&
                !file.type.startsWith('image/') &&
                !file.type.startsWith('video/')
            ) {
                updateUploadStatus(uploadId, 'error', 'Albums only support images and videos');
                continue;
            }

            updateUploadStatus(uploadId, 'uploading');

            const formData = new FormData();
            formData.append('file', file);
            if (file.webkitRelativePath) {
                const pathParts = file.webkitRelativePath.split('/');
                pathParts.pop();
                formData.append('path', pathParts.join('/'));
            } else {
                formData.append('path', '');
            }

            if (targetFolderId) {
                formData.append('folderId', targetFolderId);
            }
            if (targetAlbumId) {
                formData.append('albumId', targetAlbumId);
            }

            try {
                const res = await API.files.upload(formData);
                if (!res.status) {
                    toast.error(`Upload failed for ${file.name}: ${res.message}`);
                    updateUploadStatus(uploadId, 'error', res.message);
                } else {
                    toast.success(`File ${file.name} uploaded successfully`);
                    updateUploadStatus(uploadId, 'success');
                    setTimeout(() => {
                        removeUpload(uploadId);
                    }, 5000);
                }
            } catch (e) {
                console.error('Upload failed', e);
                toast.error(`Upload failed for ${file.name}`);
                updateUploadStatus(uploadId, 'error', 'Upload failed');
            }
        }

        uploading = false;
        invalidateAll();
    }
</script>

<svelte:window onpaste={handlePaste} />

<div class="space-y-6">
    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h2 class="text-2xl font-bold tracking-tight">Upload Center</h2>
            <p class="text-sm text-muted-foreground">
                Upload files directly to general storage, a folder, or a media album.
            </p>
        </div>
    </div>

    <!-- Destination Selector Card -->
    <Card.Root class="border-border/60 shadow-xs">
        <Card.Header class="pb-3">
            <Card.Title class="text-base font-semibold">Destination</Card.Title>
            <Card.Description>
                Choose where your uploaded files and images should be organized.
            </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
            <!-- Target Type Switcher -->
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                    type="button"
                    class="flex items-center gap-3 rounded-lg border p-3 text-left transition-all {targetType ===
                    'root'
                        ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                        : 'border-border bg-card hover:bg-muted/50'}"
                    onclick={() => (targetType = 'root')}
                >
                    <div
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md {targetType ===
                        'root'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'}"
                    >
                        <HardDrive class="h-5 w-5" />
                    </div>
                    <div>
                        <div class="text-sm font-medium">Direct / Root</div>
                        <div class="text-xs text-muted-foreground">General storage</div>
                    </div>
                </button>

                <button
                    type="button"
                    class="flex items-center gap-3 rounded-lg border p-3 text-left transition-all {targetType ===
                    'folder'
                        ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                        : 'border-border bg-card hover:bg-muted/50'}"
                    onclick={() => (targetType = 'folder')}
                >
                    <div
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md {targetType ===
                        'folder'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'}"
                    >
                        <FolderIcon class="h-5 w-5" />
                    </div>
                    <div>
                        <div class="text-sm font-medium">Folder</div>
                        <div class="text-xs text-muted-foreground">Organize any files</div>
                    </div>
                </button>

                <button
                    type="button"
                    class="flex items-center gap-3 rounded-lg border p-3 text-left transition-all {targetType ===
                    'album'
                        ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                        : 'border-border bg-card hover:bg-muted/50'}"
                    onclick={() => (targetType = 'album')}
                >
                    <div
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md {targetType ===
                        'album'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'}"
                    >
                        <ImagesIcon class="h-5 w-5" />
                    </div>
                    <div>
                        <div class="text-sm font-medium">Album</div>
                        <div class="text-xs text-muted-foreground">Images & videos</div>
                    </div>
                </button>
            </div>

            <!-- Sub Options for Folder -->
            {#if targetType === 'folder'}
                <div class="space-y-4 rounded-lg border border-border/80 bg-muted/30 p-4">
                    <div class="flex items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant={folderMode === 'existing' ? 'default' : 'outline'}
                            onclick={() => (folderMode = 'existing')}
                            disabled={folders.length === 0}
                        >
                            Existing Folder ({folders.length})
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={folderMode === 'new' ? 'default' : 'outline'}
                            onclick={() => (folderMode = 'new')}
                        >
                            <Plus class="mr-1 h-3.5 w-3.5" />
                            New Folder
                        </Button>
                    </div>

                    {#if folderMode === 'existing'}
                        {#if folders.length === 0}
                            <p class="text-sm text-muted-foreground">
                                No folders available. Create a new folder below.
                            </p>
                        {:else}
                            <div class="space-y-1.5">
                                <label
                                    for="folder-select"
                                    class="text-xs font-medium text-muted-foreground"
                                >
                                    Select Folder:
                                </label>
                                <select
                                    id="folder-select"
                                    bind:value={selectedFolderId}
                                    class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    {#each folders as folder (folder.id)}
                                        <option value={folder.id}>
                                            {folder.name} ({folder.fileCount}
                                            {folder.fileCount === 1 ? 'file' : 'files'})
                                        </option>
                                    {/each}
                                </select>
                            </div>
                        {/if}
                    {:else}
                        <div class="space-y-1.5">
                            <label
                                for="new-folder-name"
                                class="text-xs font-medium text-muted-foreground"
                            >
                                New Folder Name:
                            </label>
                            <Input
                                id="new-folder-name"
                                placeholder="e.g. Invoices, Projects 2026..."
                                bind:value={newFolderName}
                                class="max-w-md bg-background"
                            />
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- Sub Options for Album -->
            {#if targetType === 'album'}
                <div class="space-y-4 rounded-lg border border-border/80 bg-muted/30 p-4">
                    <div class="flex items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant={albumMode === 'existing' ? 'default' : 'outline'}
                            onclick={() => (albumMode = 'existing')}
                            disabled={albums.length === 0}
                        >
                            Existing Album ({albums.length})
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={albumMode === 'new' ? 'default' : 'outline'}
                            onclick={() => (albumMode = 'new')}
                        >
                            <Plus class="mr-1 h-3.5 w-3.5" />
                            New Album
                        </Button>
                    </div>

                    {#if albumMode === 'existing'}
                        {#if albums.length === 0}
                            <p class="text-sm text-muted-foreground">
                                No albums available. Create a new album below.
                            </p>
                        {:else}
                            <div class="space-y-1.5">
                                <label
                                    for="album-select"
                                    class="text-xs font-medium text-muted-foreground"
                                >
                                    Select Album:
                                </label>
                                <select
                                    id="album-select"
                                    bind:value={selectedAlbumId}
                                    class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    {#each albums as album (album.id)}
                                        <option value={album.id}>
                                            {album.name || 'Unnamed Album'} ({album.imageCount}
                                            {album.imageCount === 1 ? 'item' : 'items'})
                                        </option>
                                    {/each}
                                </select>
                            </div>
                        {/if}
                    {:else}
                        <div class="space-y-1.5">
                            <label
                                for="new-album-name"
                                class="text-xs font-medium text-muted-foreground"
                            >
                                New Album Name (optional):
                            </label>
                            <Input
                                id="new-album-name"
                                placeholder="e.g. Summer Vacation, Screenshots..."
                                bind:value={newAlbumName}
                                class="max-w-md bg-background"
                            />
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- Destination Status Indicator -->
            <div
                class="flex items-center justify-between rounded-md border border-border/50 bg-card px-3 py-2 text-xs"
            >
                <div class="flex items-center gap-2">
                    <span class="text-muted-foreground">Target Destination:</span>
                    <Badge variant="secondary" class="font-medium">
                        {activeTargetDescription}
                    </Badge>
                </div>
                {#if targetType !== 'root'}
                    <button
                        type="button"
                        class="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                        onclick={resetTarget}
                    >
                        <X class="h-3 w-3" />
                        <span>Reset to Root</span>
                    </button>
                {/if}
            </div>
        </Card.Content>
    </Card.Root>

    <!-- Upload Dropzone Card -->
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
                <input
                    type="file"
                    id="folderInput"
                    class="hidden"
                    webkitdirectory
                    multiple
                    onchange={handleFileSelect}
                />
                <div class="flex flex-col items-center space-y-2">
                    <UploadCloud class="h-12 w-12 text-muted-foreground" />
                    <div class="text-sm text-muted-foreground">
                        <button
                            type="button"
                            class="font-medium text-primary hover:text-primary/80"
                            onclick={(e) => {
                                e.stopPropagation();
                                document.getElementById('fileInput')?.click();
                            }}>Upload files</button
                        >
                        or
                        <button
                            type="button"
                            class="font-medium text-primary hover:text-primary/80"
                            onclick={(e) => {
                                e.stopPropagation();
                                document.getElementById('folderInput')?.click();
                            }}>Upload a folder</button
                        >
                        or drag and drop
                    </div>
                    <p class="text-xs text-muted-foreground">
                        {#if targetType === 'album'}
                            Images & Videos (PNG, JPG, GIF, MP4, WebM) up to {data.uploadLimit}
                        {:else}
                            All supported file formats up to {data.uploadLimit}
                        {/if}
                    </p>
                    {#if targetType !== 'root'}
                        <div class="pt-2">
                            <Badge
                                variant="outline"
                                class="border-primary/40 bg-primary/5 text-xs font-normal"
                            >
                                Uploads will be added to: <strong class="ml-1 font-semibold"
                                    >{activeTargetDescription}</strong
                                >
                            </Badge>
                        </div>
                    {/if}
                </div>
            </div>

            {#if uploads.length > 0}
                <div class="mt-6 space-y-3">
                    <h3 class="text-sm font-medium text-muted-foreground">Uploads</h3>
                    <div class="space-y-2">
                        {#each uploads as upload (upload.id)}
                            <div
                                class="flex items-center justify-between rounded-lg border bg-card p-3 shadow-xs transition-all"
                            >
                                <div class="flex items-center gap-3">
                                    <span class="text-sm font-medium">{upload.name}</span>
                                    {#if upload.message}
                                        <span class="text-xs text-destructive"
                                            >{upload.message}</span
                                        >
                                    {/if}
                                </div>
                                <Badge
                                    variant={upload.status === 'error' ? 'destructive' : 'outline'}
                                    class={upload.status === 'pending'
                                        ? 'border-yellow-500/50 bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25'
                                        : upload.status === 'success'
                                          ? 'border-green-500/50 bg-green-500/15 text-green-600 hover:bg-green-500/25'
                                          : ''}
                                >
                                    {upload.status === 'pending'
                                        ? 'Pending'
                                        : upload.status === 'uploading'
                                          ? 'Uploading...'
                                          : upload.status === 'success'
                                            ? 'Completed'
                                            : 'Failed'}
                                </Badge>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </Card.Content>
    </Card.Root>

    {#if uploading}
        <div class="animate-pulse text-center font-medium text-primary">Uploading files...</div>
    {/if}
</div>

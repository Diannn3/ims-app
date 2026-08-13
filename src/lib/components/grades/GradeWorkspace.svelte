<script lang="ts">
  import { onMount } from 'svelte';
  import GradeCalculator from './GradeCalculator.svelte';
  import {
    createBlankGradebook,
    deleteGradebook,
    isGradebookDocument,
    listGradebooks,
    saveGradebook
  } from '$lib/domain/grades/storage';
  import type { GradebookDocument } from '$lib/domain/grades/types';

  let gradebooks = $state<GradebookDocument[]>([]);
  let selectedId = $state<string | null>(null);
  let loading = $state(true);
  let storageError = $state<string | null>(null);
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let fileInput = $state<HTMLInputElement | null>(null);

  const selected = $derived(
    gradebooks.find((gradebook) => gradebook.id === selectedId) ?? null
  );

  onMount(async () => {
    try {
      gradebooks = await listGradebooks();
      selectedId = gradebooks[0]?.id ?? null;
    } catch (error) {
      storageError = error instanceof Error ? error.message : 'Could not load local gradebooks.';
    } finally {
      loading = false;
    }
  });

  async function createGradebook() {
    const gradebook = createBlankGradebook(`Course ${gradebooks.length + 1}`);
    gradebooks = [gradebook, ...gradebooks];
    selectedId = gradebook.id;
    await persist(gradebook);
  }

  async function persist(gradebook: GradebookDocument) {
    try {
      await saveGradebook(gradebook);
      storageError = null;
    } catch (error) {
      storageError = error instanceof Error ? error.message : 'Could not save gradebook.';
    }
  }

  function onGradebookChange(updated: GradebookDocument) {
    gradebooks = gradebooks.map((gradebook) => gradebook.id === updated.id ? updated : gradebook);
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => persist(updated), 350);
  }

  async function removeSelected() {
    if (!selected) return;
    const id = selected.id;
    await deleteGradebook(id);
    gradebooks = gradebooks.filter((gradebook) => gradebook.id !== id);
    selectedId = gradebooks[0]?.id ?? null;
  }

  function exportSelected() {
    if (!selected) return;
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${selected.name.trim().replace(/\s+/g, '-').toLowerCase() || 'gradebook'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importGradebook(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      if (!isGradebookDocument(parsed)) throw new Error('This file is not a valid IMS gradebook export.');

      const imported: GradebookDocument = {
        ...parsed,
        id: crypto.randomUUID(),
        updatedAt: new Date().toISOString()
      };

      gradebooks = [imported, ...gradebooks];
      selectedId = imported.id;
      await persist(imported);
    } catch (error) {
      storageError = error instanceof Error ? error.message : 'Could not import gradebook.';
    } finally {
      input.value = '';
    }
  }
</script>

<div class="workspace">
  <aside class="gradebook-panel card">
    <div class="panel-head">
      <div>
        <span class="kicker">My gradebooks</span>
        <h2>Local courses</h2>
      </div>
      <button class="button button--primary" type="button" onclick={createGradebook}>+ New</button>
    </div>

    {#if loading}
      <p class="muted">Loading gradebooks from this device…</p>
    {:else if gradebooks.length === 0}
      <div class="gradebook-empty">
        <strong>No local gradebooks yet.</strong>
        <p>Create one for any course. You do not need an account or official course record.</p>
        <button class="button button--primary" type="button" onclick={createGradebook}>Create gradebook</button>
      </div>
    {:else}
      <div class="gradebook-list">
        {#each gradebooks as gradebook}
          <button
            type="button"
            class:selected={gradebook.id === selectedId}
            aria-pressed={gradebook.id === selectedId}
            onclick={() => (selectedId = gradebook.id)}
          >
            <span>
              <strong>{gradebook.name}</strong>
              <small>{gradebook.categories.length} categor{gradebook.categories.length === 1 ? 'y' : 'ies'}</small>
            </span>
            <span aria-hidden="true">→</span>
          </button>
        {/each}
      </div>
    {/if}

    <div class="panel-actions">
      <input
        bind:this={fileInput}
        class="visually-hidden"
        id="gradebook-import"
        type="file"
        accept="application/json,.json"
        onchange={importGradebook}
      />
      <label class="button button--secondary" for="gradebook-import">Import JSON</label>
      <button class="button button--secondary" type="button" onclick={exportSelected} disabled={!selected}>Export</button>
      <button class="danger-button" type="button" onclick={removeSelected} disabled={!selected}>Delete</button>
    </div>

    <p class="privacy-note">
      Gradebooks are stored in IndexedDB on this browser. They are not part of the Supabase academic database.
    </p>

    {#if storageError}
      <p class="storage-error" role="alert">{storageError}</p>
    {/if}
  </aside>

  <section class="calculator-panel">
    {#if selected}
      {#key selected.id}
        <GradeCalculator initial={selected} onChange={onGradebookChange} />
      {/key}
    {:else if !loading}
      <div class="empty-state card">
        <span class="badge badge--green">Private tool</span>
        <h2>Create a gradebook to start.</h2>
        <p>Your categories, scores, what-if calculations, and grading scale will stay on this device.</p>
      </div>
    {/if}
  </section>
</div>

<style>
  .workspace {
    display: grid;
    gap: 14px;
  }

  .gradebook-panel {
    padding: 17px;
    display: grid;
    align-content: start;
    gap: 15px;
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: end;
  }

  .panel-head h2 {
    margin: 4px 0 0;
    color: var(--ink-strong);
    font-size: 1.25rem;
  }

  .gradebook-empty {
    display: grid;
    gap: 9px;
  }

  .gradebook-empty p {
    margin: 0;
    color: var(--muted);
    line-height: 1.5;
  }

  .gradebook-list {
    display: grid;
    gap: 6px;
  }

  .gradebook-list button {
    min-height: 62px;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: 14px;
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
    background: #fff;
    color: var(--ink);
    text-align: left;
  }

  .gradebook-list button.selected {
    border-color: rgb(0 119 184 / 0.32);
    background: var(--surface-blue);
  }

  .gradebook-list button > span:first-child {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .gradebook-list strong {
    color: var(--ink-strong);
  }

  .gradebook-list small {
    color: var(--muted);
  }

  .panel-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .panel-actions .button {
    min-height: 42px;
    font-size: 0.78rem;
  }

  .button[disabled],
  .danger-button[disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .danger-button {
    min-height: 42px;
    padding: 0 12px;
    border: 1px solid #efc8c8;
    border-radius: 13px;
    background: #fffafa;
    color: var(--danger);
    font-weight: 780;
  }

  .privacy-note,
  .storage-error {
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.45;
  }

  .privacy-note {
    color: var(--muted);
  }

  .storage-error {
    padding: 10px;
    border-radius: 12px;
    background: var(--danger-soft);
    color: #7d2d2d;
  }

  @media (min-width: 980px) {
    .workspace {
      grid-template-columns: 260px minmax(0, 1fr);
      align-items: start;
    }

    .gradebook-panel {
      position: sticky;
      top: 92px;
      max-height: calc(100svh - 112px);
      overflow: auto;
    }
  }
</style>

<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  let { id, label, name = id, type = 'text', placeholder = '', value = $bindable(''), autocomplete = 'off', required = false, spellcheck = true }: { id: string; label: string; name?: string; type?: 'text' | 'email' | 'password' | 'search' | 'number'; placeholder?: string; value?: string; autocomplete?: HTMLInputAttributes['autocomplete']; required?: boolean; spellcheck?: boolean } = $props();
</script>

<label class="grid gap-1.5 text-sm font-extrabold text-muted-strong" for={id}>
  <span>{label}</span>
  <input class="min-h-12 w-full rounded-xl border border-line-strong bg-white px-3.5 text-base text-ink shadow-[inset_0_1px_1px_rgb(7_23_40/0.03)] transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 hover:border-sky-300 focus:border-ims-blue-deep focus:outline-none focus-visible:ring-3 focus-visible:ring-ims-blue/25" {id} {name} {type} {placeholder} bind:value {autocomplete} {required} {spellcheck} />
</label>

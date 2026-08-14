<script lang="ts">
  import { AlertDialog } from 'bits-ui';
  import AppIcon from './AppIcon.svelte';
  let { open = $bindable(false), title, description, confirmLabel = 'Delete', cancelLabel = 'Keep gradebook', onConfirm, onCancel }: { open?: boolean; title: string; description: string; confirmLabel?: string; cancelLabel?: string; onConfirm: () => void | Promise<void>; onCancel: () => void } = $props();
</script>

<AlertDialog.Root bind:open onOpenChange={(next) => { if (!next && open) onCancel(); }}>
  <AlertDialog.Portal>
    <AlertDialog.Overlay class="fixed inset-0 z-[70] bg-slate-950/50 backdrop-blur-sm" />
    <AlertDialog.Content class="fixed left-1/2 top-1/2 z-[80] grid w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-line-strong bg-white p-6 text-ink shadow-[0_22px_70px_rgb(0_30_50/0.25)] focus:outline-none">
      <div class="grid size-11 place-items-center rounded-xl bg-red-50 text-danger"><AppIcon name="warning" size={22} /></div>
      <div>
        <AlertDialog.Title class="text-xl font-bold tracking-tight text-ink-strong">{title}</AlertDialog.Title>
        <AlertDialog.Description class="mt-2 leading-relaxed text-muted">{description}</AlertDialog.Description>
      </div>
      <div class="flex flex-wrap justify-end gap-2">
        <AlertDialog.Cancel class="min-h-12 cursor-pointer rounded-xl border border-line-strong bg-white px-4 font-extrabold text-ink hover:bg-slate-50 focus-visible:ring-3 focus-visible:ring-ims-blue/30" onclick={onCancel}>{cancelLabel}</AlertDialog.Cancel>
        <AlertDialog.Action class="min-h-12 cursor-pointer rounded-xl border border-danger bg-danger px-4 font-extrabold text-white hover:bg-red-900 focus-visible:ring-3 focus-visible:ring-red-400/40" onclick={onConfirm}>{confirmLabel}</AlertDialog.Action>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>

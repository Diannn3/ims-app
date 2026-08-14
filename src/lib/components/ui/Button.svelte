<script lang="ts">
  import AppIcon from './AppIcon.svelte';
  import type { ControlSize, IconName, StatusTone } from '$lib/ui/design-system';

  let {
    href = null,
    label,
    icon = null,
    tone = 'info',
    size = 'default',
    disabled = false,
    type = 'button',
    onclick
  }: {
    href?: string | null;
    label: string;
    icon?: IconName | null;
    tone?: StatusTone;
    size?: ControlSize;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    onclick?: (event: MouseEvent) => void;
  } = $props();

  const sizes = { compact: 'min-h-11 px-3 text-sm', default: 'min-h-12 px-4', large: 'min-h-14 px-5 text-[1.02rem]' } as const;
  const tones = {
    neutral: 'border-line-strong bg-white text-ink hover:border-ims-blue/40 hover:bg-sky-50/50',
    info: 'border-ims-blue-deep bg-ims-blue-deep text-white shadow-[0_8px_22px_rgb(0_119_184/0.18)] hover:bg-ims-blue-ink',
    success: 'border-ims-green-deep bg-ims-green-deep text-white hover:bg-green-800',
    warning: 'border-amber-400 bg-yellow-100 text-amber-950 hover:bg-yellow-200',
    danger: 'border-danger bg-danger text-white hover:bg-red-900'
  } as const;
  const classes = $derived(`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border font-extrabold no-underline transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px focus-visible:ring-3 focus-visible:ring-ims-blue/30 disabled:pointer-events-none disabled:opacity-50 ${sizes[size]} ${tones[tone]}`);
</script>

{#if href && !disabled}
  <a class={classes} {href}>{#if icon}<AppIcon name={icon} size={18} />{/if}{label}</a>
{:else}
  <button class={classes} {type} {disabled} {onclick}>{#if icon}<AppIcon name={icon} size={18} />{/if}{label}</button>
{/if}

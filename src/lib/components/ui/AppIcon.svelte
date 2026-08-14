<script lang="ts">
  import { BookOpen, Building2, CalendarDays, CheckCircle2, ChevronRight, Clock3, Download, FileText, FlaskConical, GraduationCap, Home, Info, Map, Maximize2, Minus, Plus, Route, Search, ShieldCheck, SlidersHorizontal, Trash2, TriangleAlert, Upload, UsersRound, X } from '@lucide/svelte';
  import type { IconName } from '$lib/ui/design-system';

  let { name, size = 20, strokeWidth = 1.8 }: { name: IconName; size?: number; strokeWidth?: number } = $props();
  const icons = { home: Home, map: Map, academics: GraduationCap, people: UsersRound, tools: SlidersHorizontal, search: Search, route: Route, calendar: CalendarDays, building: Building2, book: BookOpen, clock: Clock3, research: FlaskConical, document: FileText, shield: ShieldCheck, warning: TriangleAlert, success: CheckCircle2, info: Info, close: X, plus: Plus, minus: Minus, fit: Maximize2, trash: Trash2, download: Download, upload: Upload, next: ChevronRight } as const;
  const Icon = $derived(icons[name]);
</script>

<Icon {size} {strokeWidth} aria-hidden="true" />

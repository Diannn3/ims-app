<script lang="ts">
  import GradeWorkspace from '$lib/components/grades/GradeWorkspace.svelte';
  import InlineAlert from '$lib/components/ui/InlineAlert.svelte';
  import PageHeader from '$lib/components/shell/PageHeader.svelte';
</script>

<svelte:head><title>Grade Calculator · IMS Academic Hub</title><meta name="description" content="Private local-first weighted grade calculator with what-if and target-grade tools." /></svelte:head>

<div class="mx-auto grid w-full max-w-[1180px] gap-6 px-4 py-7 sm:px-6 sm:py-9">
  <PageHeader eyebrow="Academic tools" title="Grade calculator" description="Build the grading structure from your syllabus, test scenarios, and calculate target averages. Your gradebooks stay in this browser." />
  <InlineAlert tone="success" title="Local-first by design" message="Gradebook content is stored in IndexedDB on this device and stays separate from institutional data, staff imports, and search." />
  <GradeWorkspace />
</div>

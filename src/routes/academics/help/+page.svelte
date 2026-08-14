<script lang="ts">import PageHeader from '$lib/components/shell/PageHeader.svelte';</script>
<svelte:head><title>Academic Help · IMS Academic Hub</title></svelte:head>
<div class="mx-auto grid w-full max-w-[1180px] gap-7 px-4 py-7 sm:px-6 sm:py-9"><PageHeader eyebrow="Who do I ask?" title="Start with the kind of help you need." description="This guide routes students to published people, services, and official resources. It does not replace academic advising." />
<section class="grid divide-y divide-line border-y border-line bg-white md:grid-cols-2 md:divide-x md:divide-y-0" aria-label="Academic help paths">
{#each [
  { tone:'border-ims-blue-deep', label:'Course concern', title:'I need help with a class.', copy:'Open the course, find its published instructor, then view scheduled consultation hours.', actions:[['Browse Courses','/academics'],['Consultations','/consultations']] },
  { tone:'border-ims-green', label:'Math help', title:'I need help understanding a topic.', copy:'Start with the Math Clinic and its published location or service information.', actions:[['Open Math Clinic','/services/math-clinic']] },
  { tone:'border-slate-400', label:'Process / form', title:'I need an academic form or template.', copy:'Use source-tracked official resources rather than old copies shared in group chats.', actions:[['Academic Resources','/academics/forms']] },
  { tone:'border-ims-yellow', label:'Research', title:'I want to explore research areas.', copy:'Browse published research areas and related public faculty profiles.', actions:[['Research Explorer','/research']] }
] as item}<article class={`grid min-h-56 content-start gap-3 border-t-4 p-5 ${item.tone}`}><span class="font-mono text-xs font-semibold uppercase tracking-[.12em] text-muted">{item.label}</span><h2 class="mt-auto text-2xl font-semibold tracking-tight text-ink-strong">{item.title}</h2><p class="leading-relaxed text-muted">{item.copy}</p><div class="flex flex-wrap gap-2">{#each item.actions as action}<a class="inline-flex min-h-11 items-center border border-line-strong px-3 font-bold no-underline hover:bg-sky-50" href={action[1]}>{action[0]}</a>{/each}</div></article>{/each}
</section></div>

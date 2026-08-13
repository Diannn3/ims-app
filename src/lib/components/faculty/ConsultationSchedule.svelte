<script lang="ts">
  import type { ConsultationSummary } from '$lib/domain/academic/types';
  import { formatConsultationWindow, weekdayName } from '$lib/domain/academic/formatters';

  let { items }: { items: ConsultationSummary[] } = $props();

  const modeLabel: Record<ConsultationSummary['mode'], string> = {
    in_person: 'In person',
    online: 'Online',
    hybrid: 'Hybrid',
    by_appointment: 'By appointment'
  };
</script>

<div class="consultation-list">
  {#each items as item}
    <article class="consultation card card--flat">
      <div>
        <span class="day">{weekdayName(item.weekday)}</span>
        <strong>{formatConsultationWindow(item.startsAt, item.endsAt)}</strong>
      </div>
      <div class="meta">
        <span class="badge badge--green">{modeLabel[item.mode]}</span>
        {#if item.spaceId}
          <a href={`/room/${item.spaceId}`}>{item.spaceId.toUpperCase()}</a>
        {/if}
      </div>
      {#if item.notes}
        <p>{item.notes}</p>
      {/if}
      {#if item.appointmentUrl}
        <a class="button button--secondary" href={item.appointmentUrl} target="_blank" rel="noopener noreferrer">
          Booking link
        </a>
      {/if}
    </article>
  {/each}
</div>

<style>
  .consultation-list {
    display: grid;
    gap: 9px;
  }

  .consultation {
    padding: 15px;
    display: grid;
    gap: 10px;
  }

  .consultation > div:first-child {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: baseline;
  }

  .day {
    color: var(--ink-strong);
    font-weight: 820;
  }

  strong {
    color: var(--brand-blue-ink);
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .meta a {
    color: var(--brand-blue-ink);
    font-size: 0.78rem;
    font-weight: 800;
  }

  p {
    margin: 0;
    color: var(--muted);
    line-height: 1.5;
  }
</style>

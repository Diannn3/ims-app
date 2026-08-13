<script lang="ts">
  import AcademicEmptyState from '$lib/components/academic/AcademicEmptyState.svelte';
  import ConsultationSchedule from '$lib/components/faculty/ConsultationSchedule.svelte';
  let { data } = $props();


  function groupByFaculty(items: typeof data.items) {
    const groups = new Map<string, typeof data.items>();
    for (const item of items) {
      const current = groups.get(item.facultyName) ?? [];
      current.push(item);
      groups.set(item.facultyName, current);
    }
    return [...groups.entries()];
  }

  const dayOptions = [
    { value: '', label: 'All days' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' }
  ];
</script>

<svelte:head>
  <title>Consultations · IMS Academic Hub</title>
</svelte:head>

<div class="page page-stack consultation-page">
  <section class="page-heading">
    <span class="eyebrow">Consultations</span>
    <h1>Find scheduled faculty consultation hours.</h1>
    <p>
      Consultation data is term-specific and published only after verification. Schedules describe
      planned availability—not live faculty location.
    </p>
  </section>

  <form class="filter-card card" method="GET">
    <label class="field">
      <span>Day</span>
      <div class="filter-row">
        <select class="select" name="day">
          {#each dayOptions as option}
            <option value={option.value} selected={String(data.weekday ?? '') === option.value}>{option.label}</option>
          {/each}
        </select>
        <button class="button button--primary" type="submit">Apply filter</button>
      </div>
    </label>
  </form>

  <section class="results" aria-labelledby="consultation-results-title">
    <div class="section-header">
      <div>
        <span class="kicker">Published schedule</span>
        <h2 id="consultation-results-title">Consultation hours</h2>
      </div>
      {#if data.items.length}
        <span class="badge">{data.items.length} result{data.items.length === 1 ? '' : 's'}</span>
      {/if}
    </div>

    {#if !data.repositoryStatus.configured}
      <AcademicEmptyState
        title="Consultation data is not connected yet"
        message="The app is ready for current-term consultation data, but no academic repository is configured in this deployment."
      />
    {:else if data.items.length === 0}
      <AcademicEmptyState
        title="No published consultation hours"
        message="No verified consultation records match this view for the current term."
      />
    {:else}
      <div class="faculty-groups">
        {#each groupByFaculty(data.items) as [facultyName, items]}
          <section class="faculty-group card">
            <div class="faculty-group__head">
              <div>
                <span class="kicker">Faculty</span>
                <h3>{facultyName}</h3>
              </div>
              {#if items?.[0]}
                <a class="button button--quiet" href={`/faculty/${items[0].facultySlug}`}>Profile →</a>
              {/if}
            </div>
            {#if items}
              <ConsultationSchedule items={items} />
            {/if}
          </section>
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  .consultation-page,
  .results,
  .faculty-groups {
    gap: 18px;
  }

  .filter-card {
    padding: 14px;
  }

  .filter-row {
    display: grid;
    gap: 8px;
  }

  .faculty-group {
    padding: 18px;
    display: grid;
    gap: 14px;
  }

  .faculty-group__head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  .faculty-group h3 {
    margin: 4px 0 0;
    color: var(--ink-strong);
    font-size: 1.2rem;
  }

  @media (min-width: 620px) {
    .filter-row {
      grid-template-columns: minmax(220px, 360px) auto;
      justify-content: start;
    }
  }

  @media (min-width: 900px) {
    .faculty-groups {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>

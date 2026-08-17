<script lang="ts">
  import { calculateGradebook, requiredAverageForTarget } from '$lib/domain/grades/calculator';
  import type { GradebookDocument, GradeCategory } from '$lib/domain/grades/types';

  let {
    initial,
    onChange = () => {}
  }: {
    initial: GradebookDocument;
    onChange?: (gradebook: GradebookDocument) => void;
  } = $props();

  function cloneInitialDocument() {
    return structuredClone(initial);
  }

  const initialDocument = cloneInitialDocument();
  let name = $state(initialDocument.name);
  let categories = $state<GradeCategory[]>(structuredClone(initialDocument.categories));
  let gradingScale = $state(structuredClone(initialDocument.gradingScale));
  let target = $state(80);
  let whatIfAssessmentId = $state('');
  let whatIfEarned = $state<number | null>(null);
  let whatIfPossible = $state<number | null>(null);

  const result = $derived(calculateGradebook(categories));
  const remainingWeight = $derived(Math.max(0, 100 - result.gradedWeight));
  const required = $derived(requiredAverageForTarget(target, result.earnedWeightedPoints, remainingWeight));

  const pendingAssessments = $derived(
    categories.flatMap((category) =>
      category.assessments
        .filter((assessment) => assessment.earned === null || assessment.possible === null)
        .map((assessment) => ({
          categoryId: category.id,
          assessmentId: assessment.id,
          label: `${category.name} · ${assessment.name}`
        }))
    )
  );

  const simulatedCategories = $derived.by(() => {
    if (!whatIfAssessmentId || whatIfEarned === null || whatIfPossible === null || whatIfPossible <= 0) {
      return null;
    }

    const clone = structuredClone(categories);
    for (const category of clone) {
      const assessment = category.assessments.find((item) => item.id === whatIfAssessmentId);
      if (assessment) {
        assessment.earned = whatIfEarned;
        assessment.possible = whatIfPossible;
        break;
      }
    }
    return clone;
  });

  const projectedResult = $derived(simulatedCategories ? calculateGradebook(simulatedCategories) : null);

  $effect(() => {
    onChange({
      version: 1,
      id: initialDocument.id,
      name,
      categories: structuredClone(categories),
      gradingScale: structuredClone(gradingScale),
      updatedAt: new Date().toISOString()
    });
  });

  function addCategory() {
    categories.push({
      id: crypto.randomUUID(),
      name: 'New Category',
      weight: 0,
      mode: 'points',
      assessments: []
    });
  }

  function addAssessment(category: GradeCategory) {
    category.assessments.push({
      id: crypto.randomUUID(),
      name: 'New Assessment',
      earned: null,
      possible: null
    });
  }

  function removeAssessment(category: GradeCategory, id: string) {
    category.assessments = category.assessments.filter((assessment) => assessment.id !== id);
  }

  function removeCategory(id: string) {
    categories = categories.filter((category) => category.id !== id);
  }

  function addScaleRow() {
    gradingScale.push({
      id: crypto.randomUUID(),
      minimumPercent: 0,
      label: '1.00'
    });
  }

  function removeScaleRow(id: string) {
    gradingScale = gradingScale.filter((row) => row.id !== id);
  }

  function fmt(value: number | null) {
    return value === null || !Number.isFinite(value) ? '—' : `${value.toFixed(2)}%`;
  }

  const equivalentLabel = $derived.by(() => {
    if (result.performanceOnGradedWork === null || gradingScale.length === 0) return null;
    const sorted = [...gradingScale].sort((a, b) => b.minimumPercent - a.minimumPercent);
    return sorted.find((row) => result.performanceOnGradedWork! >= row.minimumPercent)?.label ?? null;
  });
</script>

<div class="grade-app">
  <section class="course-name card">
    <label class="field">
      <span>Gradebook name</span>
      <input class="input name-input" bind:value={name} placeholder="e.g. MATH 38" />
    </label>
    <span class="privacy-chip badge badge--green">Stored on this device</span>
  </section>

  <section class="summary card">
    <div class="metric">
      <span>Performance on graded work</span>
      <strong>{fmt(result.performanceOnGradedWork)}</strong>
      <small>Pending assessments are excluded.</small>
    </div>
    <div class="metric">
      <span>Weighted points earned</span>
      <strong>{result.earnedWeightedPoints.toFixed(2)} / 100</strong>
      <small>Contribution already earned from entered scores.</small>
    </div>
    <div class="metric">
      <span>Configured weights</span>
      <strong class:warn={Math.abs(result.enteredWeight - 100) > 0.001}>{result.enteredWeight.toFixed(0)}%</strong>
      <small>{Math.abs(result.enteredWeight - 100) > 0.001 ? 'Adjust categories to reach 100%.' : 'Weights are complete.'}</small>
    </div>
    {#if equivalentLabel}
      <div class="metric">
        <span>Your custom equivalent</span>
        <strong>{equivalentLabel}</strong>
        <small>Based only on the scale you entered below.</small>
      </div>
    {/if}
  </section>

  <section class="categories-section">
    <div class="section-header">
      <div>
        <span class="kicker">Grading structure</span>
        <h2>Categories and scores</h2>
      </div>
      <button class="button button--secondary" type="button" onclick={addCategory}>+ Category</button>
    </div>

    <div class="category-list">
      {#each categories as category}
        <section class="category card">
          <div class="category-head">
            <label class="field category-name">
              <span>Category</span>
              <input class="input" bind:value={category.name} aria-label="Category name" />
            </label>

            <label class="field weight-field">
              <span>Weight</span>
              <div class="suffix-field">
                <input
                  class="input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  bind:value={category.weight}
                  aria-label={`${category.name} weight`}
                />
                <span>%</span>
              </div>
            </label>

            <button
              class="remove-button"
              type="button"
              onclick={() => removeCategory(category.id)}
              aria-label={`Remove ${category.name}`}
            >
              Remove
            </button>
          </div>

          <div class="mode-row">
            <label class="field">
              <span>Calculation method</span>
              <select class="select" bind:value={category.mode}>
                <option value="points">Total points within category</option>
                <option value="equal-average">Equal average per assessment</option>
              </select>
            </label>
            <div class="category-result">
              <span>Current</span>
              <strong>{fmt(result.categories.find((item) => item.id === category.id)?.percent ?? null)}</strong>
            </div>
          </div>

          <div class="assessment-table" role="group" aria-label={`${category.name} assessments`}>
            <div class="assessment-header" aria-hidden="true">
              <span>Assessment</span>
              <span>Score</span>
              <span>Total</span>
              <span></span>
            </div>

            {#if category.assessments.length === 0}
              <p class="no-assessments">No assessments yet. Add one when you have a score or want to plan ahead.</p>
            {/if}

            {#each category.assessments as assessment}
              <div class="assessment-row">
                <label>
                  <span class="visually-hidden">Assessment name</span>
                  <input class="input" bind:value={assessment.name} />
                </label>
                <label>
                  <span class="visually-hidden">{assessment.name} score</span>
                  <input
                    class="input"
                    type="number"
                    min="0"
                    step="0.01"
                    bind:value={assessment.earned}
                    placeholder="—"
                    inputmode="decimal"
                  />
                </label>
                <label>
                  <span class="visually-hidden">{assessment.name} total points</span>
                  <input
                    class="input"
                    type="number"
                    min="0"
                    step="0.01"
                    bind:value={assessment.possible}
                    placeholder="—"
                    inputmode="decimal"
                  />
                </label>
                <button
                  class="icon-remove"
                  type="button"
                  onclick={() => removeAssessment(category, assessment.id)}
                  aria-label={`Remove ${assessment.name}`}
                >
                  ×
                </button>
              </div>
            {/each}
          </div>

          <button class="add-assessment" type="button" onclick={() => addAssessment(category)}>+ Add assessment</button>
        </section>
      {/each}
    </div>
  </section>

  <section class="tool-grid">
    <article class="target card card--yellow">
      <span class="kicker">Target tool</span>
      <h2>What do I need on the remaining weight?</h2>
      <label class="field">
        <span>Target final percentage</span>
        <div class="suffix-field target-input">
          <input class="input" type="number" min="0" max="100" step="0.1" bind:value={target} />
          <span>%</span>
        </div>
      </label>

      {#if required !== null}
        {#if required > 100}
          <p class="result-box result-box--bad">
            You would need <strong>{required.toFixed(2)}%</strong> across the remaining
            {remainingWeight.toFixed(1)}% weight. That is above 100% under this simplified setup.
          </p>
        {:else if required <= 0}
          <p class="result-box result-box--good">
            Your entered weighted points already mathematically cover this target, assuming the
            grading structure is complete and there are no special course rules.
          </p>
        {:else}
          <p class="result-box">
            Required average across the remaining {remainingWeight.toFixed(1)}% weight:
            <strong>{required.toFixed(2)}%</strong>.
          </p>
        {/if}
      {:else}
        <p class="muted">No remaining course weight is available for a target calculation.</p>
      {/if}
    </article>

    <article class="what-if card card--blue">
      <span class="kicker">What-if mode</span>
      <h2>Test one pending score.</h2>

      {#if pendingAssessments.length}
        <label class="field">
          <span>Pending assessment</span>
          <select class="select" bind:value={whatIfAssessmentId}>
            <option value="">Choose an assessment</option>
            {#each pendingAssessments as item}
              <option value={item.assessmentId}>{item.label}</option>
            {/each}
          </select>
        </label>

        <div class="what-if-score">
          <label class="field">
            <span>What if I score</span>
            <input class="input" type="number" min="0" step="0.01" bind:value={whatIfEarned} inputmode="decimal" />
          </label>
          <span class="slash">/</span>
          <label class="field">
            <span>Out of</span>
            <input class="input" type="number" min="0" step="0.01" bind:value={whatIfPossible} inputmode="decimal" />
          </label>
        </div>

        <div class="projection">
          <span>Projected performance on graded work</span>
          <strong>{fmt(projectedResult?.performanceOnGradedWork ?? null)}</strong>
          <small>This does not overwrite your actual score.</small>
        </div>
      {:else}
        <p class="muted">Add at least one pending assessment to use what-if mode.</p>
      {/if}
    </article>
  </section>

  <section class="grading-scale card">
    <div class="section-header">
      <div>
        <span class="kicker">Optional</span>
        <h2>Custom grading scale</h2>
        <p>Enter only the conversion table published for your course. The app does not assume one universal UP transmutation.</p>
      </div>
      <button class="button button--secondary" type="button" onclick={addScaleRow}>+ Scale row</button>
    </div>

    {#if gradingScale.length === 0}
      <p class="muted scale-empty">No grading conversion added. Percentage calculations still work normally.</p>
    {:else}
      <div class="scale-list">
        {#each gradingScale as row}
          <div class="scale-row">
            <label class="field">
              <span>Minimum %</span>
              <input class="input" type="number" min="0" max="100" step="0.01" bind:value={row.minimumPercent} />
            </label>
            <label class="field">
              <span>Equivalent label</span>
              <input class="input" bind:value={row.label} placeholder="e.g. 1.25" />
            </label>
            <button class="icon-remove" type="button" onclick={() => removeScaleRow(row.id)} aria-label="Remove grading scale row">×</button>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  .grade-app,
  .categories-section,
  .category-list {
    display: grid;
    gap: 14px;
  }

  .course-name {
    padding: 15px;
    display: grid;
    gap: 10px;
    align-items: end;
  }

  .name-input {
    font-size: 1.15rem;
    font-weight: 850;
    color: var(--ink-strong);
  }

  .privacy-chip {
    width: fit-content;
  }

  .summary {
    padding: 12px;
    display: grid;
    gap: 8px;
    border-color: #0b608e;
    background:
      radial-gradient(circle at 100% 0%, rgb(0 155 255 / 0.22), transparent 16rem),
      linear-gradient(145deg, #083a59, #0b608e);
    color: #fff;
    box-shadow: 0 20px 60px rgb(0 74 117 / 0.2);
  }

  .metric {
    min-height: 118px;
    padding: 15px;
    display: grid;
    align-content: end;
    gap: 5px;
    border: 1px solid rgb(255 255 255 / 0.12);
    border-radius: 16px;
    background: rgb(255 255 255 / 0.06);
  }

  .metric span,
  .metric small {
    color: #d7edf8;
    font-size: 0.75rem;
  }

  .metric strong {
    font-size: clamp(1.55rem, 5vw, 2.35rem);
    letter-spacing: -0.045em;
  }

  .metric .warn {
    color: #fff55b;
  }

  .category {
    padding: 17px;
    display: grid;
    gap: 16px;
  }

  .category-head {
    display: grid;
    gap: 9px;
  }

  .weight-field {
    max-width: 160px;
  }

  .suffix-field {
    position: relative;
  }

  .suffix-field input {
    padding-right: 34px;
  }

  .suffix-field > span {
    position: absolute;
    top: 50%;
    right: 12px;
    translate: 0 -50%;
    color: var(--muted);
    font-size: 0.8rem;
    font-weight: 800;
  }

  .remove-button {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid #efc8c8;
    border-radius: 13px;
    background: #fffafa;
    color: var(--danger);
    font-weight: 780;
  }

  .mode-row {
    display: grid;
    gap: 10px;
    align-items: end;
  }

  .category-result {
    min-width: 120px;
    display: grid;
    gap: 2px;
  }

  .category-result span {
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 760;
  }

  .category-result strong {
    color: var(--brand-blue-ink);
    font-size: 1.45rem;
  }

  .assessment-table {
    display: grid;
    gap: 6px;
  }

  .assessment-header {
    display: none;
  }

  .assessment-row {
    padding: 10px;
    display: grid;
    grid-template-columns: 1fr 86px 86px 44px;
    gap: 6px;
    align-items: end;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--surface-soft);
  }

  .assessment-row label:first-child {
    grid-column: 1 / -1;
  }

  .icon-remove {
    width: 44px;
    height: 44px;
    border: 1px solid #efc8c8;
    border-radius: 12px;
    background: #fff;
    color: var(--danger);
    font-size: 1.2rem;
  }

  .add-assessment {
    min-height: 44px;
    padding: 0 12px;
    border: 1px dashed var(--line-strong);
    border-radius: 13px;
    background: transparent;
    color: var(--brand-blue-ink);
    font-weight: 800;
  }

  .no-assessments {
    margin: 0;
    padding: 12px;
    border: 1px dashed var(--line);
    border-radius: 13px;
    color: var(--muted);
    font-size: 0.82rem;
  }

  .tool-grid {
    display: grid;
    gap: 14px;
  }

  .target,
  .what-if,
  .grading-scale {
    padding: 19px;
    display: grid;
    gap: 14px;
    align-content: start;
  }

  .target h2,
  .what-if h2,
  .grading-scale h2 {
    margin: 2px 0 0;
    color: var(--ink-strong);
    font-size: 1.35rem;
    letter-spacing: -0.035em;
  }

  .target-input {
    max-width: 150px;
  }

  .result-box {
    margin: 0;
    padding: 13px;
    border-radius: 14px;
    background: rgb(250 248 7 / 0.16);
    color: #5f4d00;
    line-height: 1.5;
  }

  .result-box--bad {
    background: var(--danger-soft);
    color: #7d2d2d;
  }

  .result-box--good {
    background: var(--surface-green);
    color: var(--brand-green-deep);
  }

  .what-if-score {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 8px;
    align-items: end;
  }

  .slash {
    min-height: 44px;
    display: grid;
    place-items: center;
    color: var(--muted);
  }

  .projection {
    padding: 13px;
    display: grid;
    gap: 4px;
    border-radius: 14px;
    background: #fff;
    border: 1px solid var(--line);
  }

  .projection span,
  .projection small {
    color: var(--muted);
    font-size: 0.74rem;
  }

  .projection strong {
    color: var(--brand-blue-ink);
    font-size: 1.65rem;
  }

  .grading-scale .section-header {
    align-items: start;
  }

  .grading-scale .section-header p {
    max-width: 66ch;
    line-height: 1.5;
  }

  .scale-list {
    display: grid;
    gap: 8px;
  }

  .scale-row {
    display: grid;
    grid-template-columns: 1fr 1fr 44px;
    gap: 8px;
    align-items: end;
  }

  .scale-empty {
    margin: 0;
  }

  @media (min-width: 620px) {
    .course-name {
      grid-template-columns: 1fr auto;
    }

    .summary {
      grid-template-columns: repeat(3, 1fr);
    }

    .metric:nth-child(4) {
      grid-column: span 3;
      min-height: 90px;
    }

    .category-head {
      grid-template-columns: minmax(0, 1fr) 150px auto;
      align-items: end;
    }

    .mode-row {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .assessment-header {
      padding: 0 10px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 92px 92px 44px;
      gap: 8px;
      color: var(--muted);
      font-size: 0.7rem;
      font-weight: 780;
    }

    .assessment-row {
      grid-template-columns: minmax(0, 1fr) 92px 92px 44px;
    }

    .assessment-row label:first-child {
      grid-column: auto;
    }
  }

  @media (min-width: 900px) {
    .summary {
      grid-template-columns: repeat(4, 1fr);
    }

    .metric:nth-child(4) {
      grid-column: auto;
      min-height: 118px;
    }

    .tool-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>

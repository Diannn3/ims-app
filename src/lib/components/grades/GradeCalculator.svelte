<script lang="ts">
  import { calculateGradebook, requiredAverageForTarget } from '$lib/domain/grades/calculator';
  import type { GradeCategory } from '$lib/domain/grades/types';

  let nextCategory = 3;
  let nextAssessment = 5;
  let target = 80;
  let categories: GradeCategory[] = [
    {
      id: 'exams', name: 'Long Exams', weight: 50, mode: 'points',
      assessments: [
        { id: 'le1', name: 'LE 1', earned: 42, possible: 50 },
        { id: 'le2', name: 'LE 2', earned: 37, possible: 50 }
      ]
    },
    {
      id: 'quizzes', name: 'Quizzes', weight: 20, mode: 'points',
      assessments: [
        { id: 'q1', name: 'Quiz 1', earned: 9, possible: 10 },
        { id: 'q2', name: 'Quiz 2', earned: 17, possible: 20 }
      ]
    },
    {
      id: 'final', name: 'Final Exam', weight: 30, mode: 'points',
      assessments: [{ id: 'final1', name: 'Final Exam', earned: null, possible: 100 }]
    }
  ];

  $: result = calculateGradebook(categories);
  $: remainingWeight = Math.max(0, 100 - result.gradedWeight);
  $: required = requiredAverageForTarget(target, result.earnedWeightedPoints, remainingWeight);

  function touch() { categories = [...categories]; }
  function addCategory() {
    categories = [...categories, { id: `cat-${nextCategory++}`, name: 'New Category', weight: 0, mode: 'points', assessments: [] }];
  }
  function addAssessment(category: GradeCategory) {
    category.assessments = [...category.assessments, { id: `a-${nextAssessment++}`, name: 'New Assessment', earned: null, possible: null }];
    touch();
  }
  function removeAssessment(category: GradeCategory, id: string) {
    category.assessments = category.assessments.filter((a) => a.id !== id); touch();
  }
  function removeCategory(id: string) { categories = categories.filter((c) => c.id !== id); }
  const fmt = (value: number | null) => value === null || !Number.isFinite(value) ? '—' : `${value.toFixed(2)}%`;
</script>

<div class="grade-app">
  <section class="summary card">
    <div>
      <span>Performance on graded work</span>
      <strong>{fmt(result.performanceOnGradedWork)}</strong>
    </div>
    <div>
      <span>Weighted points earned so far</span>
      <strong>{result.earnedWeightedPoints.toFixed(2)} / 100</strong>
    </div>
    <div>
      <span>Configured weights</span>
      <strong class:warn={Math.abs(result.enteredWeight - 100) > 0.001}>{result.enteredWeight.toFixed(0)}%</strong>
    </div>
    <p>Pending assessments are not silently counted as zero. “Performance on graded work” renormalizes only the categories with entered scores.</p>
  </section>

  {#each categories as category}
    <section class="category card">
      <div class="category-head">
        <input class="name" bind:value={category.name} on:input={touch} aria-label="Category name" />
        <label>Weight <input class="weight" type="number" min="0" max="100" step="0.1" bind:value={category.weight} on:input={touch} />%</label>
        <button class="ghost danger" on:click={() => removeCategory(category.id)}>Remove</button>
      </div>

      <div class="mode-row">
        <label>Calculation
          <select bind:value={category.mode} on:change={touch}>
            <option value="points">Points within category</option>
            <option value="equal-average">Equal average per assessment</option>
          </select>
        </label>
        <span>{fmt(result.categories.find((c) => c.id === category.id)?.percent ?? null)}</span>
      </div>

      <div class="assessments">
        {#each category.assessments as assessment}
          <div class="assessment-row">
            <input bind:value={assessment.name} on:input={touch} aria-label="Assessment name" />
            <input type="number" min="0" step="0.01" bind:value={assessment.earned} on:input={touch} placeholder="score" aria-label={`${assessment.name} score`} />
            <span>/</span>
            <input type="number" min="0" step="0.01" bind:value={assessment.possible} on:input={touch} placeholder="total" aria-label={`${assessment.name} total`} />
            <button class="icon" on:click={() => removeAssessment(category, assessment.id)} aria-label={`Remove ${assessment.name}`}>×</button>
          </div>
        {/each}
      </div>
      <button class="ghost" on:click={() => addAssessment(category)}>+ Add assessment</button>
    </section>
  {/each}

  <button class="add-category" on:click={addCategory}>+ Add grading category</button>

  <section class="target card">
    <div>
      <span class="eyebrow">TARGET TOOL</span>
      <h3>What average do I need on the remaining weight?</h3>
    </div>
    <label>Target final percentage <input type="number" min="0" max="100" step="0.1" bind:value={target} />%</label>
    {#if required !== null}
      {#if required > 100}
        <p class="target-result bad">You would need {required.toFixed(2)}% across the remaining {remainingWeight.toFixed(1)}% weight — above 100%, so this target is not reachable under this simplified setup.</p>
      {:else if required <= 0}
        <p class="target-result good">The target is already mathematically covered by the weighted points entered so far, assuming the configured grading structure is complete.</p>
      {:else}
        <p class="target-result">Required average across the remaining {remainingWeight.toFixed(1)}% weight: <strong>{required.toFixed(2)}%</strong>.</p>
      {/if}
    {:else}
      <p class="muted">No remaining course weight is available for a target calculation.</p>
    {/if}
  </section>
</div>

<style>
  .grade-app { display: grid; gap: 14px; }
  .summary, .category, .target { padding: 18px; box-shadow: none; }
  .summary { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; background: #172554; color: white; border-color: #172554; }
  .summary div { display: grid; gap: 5px; }
  .summary span { color: #cbd3ea; font-size: 12px; font-weight: 700; }
  .summary strong { font-size: 24px; }
  .summary p { grid-column: 1 / -1; color: #d9deec; margin: 4px 0 0; font-size: 12px; line-height: 1.5; }
  .summary .warn { color: #ffd56b; }
  .category-head { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center; }
  input, select { border: 1px solid #d8d2c7; background: white; border-radius: 10px; padding: 9px 10px; min-width: 0; }
  .name { width: 100%; font-weight: 850; color: var(--navy); font-size: 18px; }
  .weight { width: 74px; }
  label { color: #626a79; font-size: 12px; font-weight: 750; }
  .mode-row { display: flex; justify-content: space-between; gap: 10px; align-items: end; margin: 12px 0; }
  .mode-row label { display: grid; gap: 5px; }
  .mode-row span { color: var(--navy); font-size: 22px; font-weight: 850; }
  .assessments { display: grid; gap: 7px; margin: 12px 0; }
  .assessment-row { display: grid; grid-template-columns: minmax(110px,1.5fr) minmax(64px,.7fr) auto minmax(64px,.7fr) auto; gap: 6px; align-items: center; }
  .ghost, .icon, .add-category { border: 1px solid #d8d2c7; background: white; border-radius: 10px; padding: 9px 11px; font-weight: 750; }
  .icon { width: 38px; color: #8d3f3f; }
  .danger { color: #8d3f3f; }
  .add-category { width: 100%; background: #f1ede5; }
  .target { display: grid; gap: 12px; }
  .target h3 { margin: 3px 0 0; color: var(--navy); }
  .target label { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .target label input { width: 95px; }
  .target-result { margin: 0; padding: 12px 14px; border-radius: 12px; background: #fff4c9; color: #5b460e; }
  .target-result.bad { background: #fff0f0; color: #7c3333; }
  .target-result.good { background: #edf8ef; color: #2b6335; }
  .eyebrow { color: #9b6b00; font-size: 11px; font-weight: 900; letter-spacing: .14em; }
  @media (max-width: 650px) {
    .summary { grid-template-columns: 1fr; }
    .category-head { grid-template-columns: 1fr auto; }
    .category-head .danger { grid-column: 1 / -1; }
    .assessment-row { grid-template-columns: 1fr 70px auto 70px auto; }
  }
</style>

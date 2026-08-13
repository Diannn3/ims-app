<script lang="ts">
  let { message = 'This academic information could not be loaded right now.' } = $props();
</script>

<section class="error-state card card--flat" role="alert">
  <span class="badge">Load problem</span>
  <h2>Academic data is temporarily unavailable.</h2>
  <p>{message}</p>
  <a class="button button--secondary" href="">Try again</a>
</section>

<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<div class="shell">
  <header class="topbar">
    <a class="brand" href="/">Math Building Hub</a>
    <span class="pill">Prototype</span>
  </header>
  {@render children()}

  <nav class="bottomnav" aria-label="Primary">
    <a href="/">Home</a>
    <a href="/map">Map</a>
    <a href="/">Academics</a>
    <a href="/tools/grades">Tools</a>
  </nav>
</div>

<script lang="ts">
  import { floorDisplayName } from '$lib/domain/navigation/spaces';
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.anchor.shortLabel} · IMS Academic Hub</title>
  <meta name="description" content={`Prototype Math Building location anchor for ${data.anchor.label}.`} />
</svelte:head>

<div class="page page--narrow anchor-page">
  <section class="anchor-hero card">
    <div class="anchor-pulse" aria-hidden="true"><span></span></div>
    <p class="eyebrow">Location anchor</p>
    <h1>You’re anchored at {data.anchor.label}.</h1>
    <p>
      Use this as your route starting point. The anchor is still a prototype and must be physically
      verified before a permanent QR code is placed in the building.
    </p>
    <div class="anchor-meta" aria-label="Anchor metadata">
      <span class="badge badge--blue">{floorDisplayName(data.anchor.floor)}</span>
      <span class="badge badge--yellow">Prototype · site verification required</span>
    </div>
    <div class="anchor-actions">
      <a class="button button--primary" href={`/map?from=${encodeURIComponent(data.anchor.nodeId)}`}>Choose a destination</a>
      <a class="button button--secondary" href="/search">Search the academic hub</a>
    </div>
  </section>

  <section class="card guidance-card">
    <span class="kicker">How QR wayfinding works</span>
    <h2>No indoor GPS required.</h2>
    <div class="guidance-steps">
      <div><strong>1</strong><span>Scan a verified location QR.</span></div>
      <div><strong>2</strong><span>The app uses its exact graph node as your start.</span></div>
      <div><strong>3</strong><span>Choose a room and follow the floor-by-floor route.</span></div>
    </div>
  </section>
</div>

<style>
  .anchor-page { display:grid; gap:14px; }
  .anchor-hero,.guidance-card { padding:clamp(20px,5vw,34px); }
  .anchor-hero { position:relative; overflow:hidden; }
  .anchor-hero::after { content:''; position:absolute; width:240px; height:240px; right:-110px; top:-120px; border-radius:50%; background:radial-gradient(circle,color-mix(in srgb,var(--brand-blue) 18%,transparent),transparent 68%); pointer-events:none; }
  .anchor-pulse { width:58px; height:58px; margin-bottom:18px; display:grid; place-items:center; border-radius:19px; background:var(--surface-blue); }
  .anchor-pulse span { width:18px; height:18px; border-radius:50%; background:var(--brand-blue-deep); box-shadow:0 0 0 7px rgb(0 119 184 / .14); }
  h1 { max-width:17ch; margin:6px 0 10px; font-size:clamp(2rem,7vw,3.6rem); line-height:.98; letter-spacing:-.055em; }
  .anchor-hero>p:not(.eyebrow) { max-width:62ch; margin:0; color:var(--muted); line-height:1.6; }
  .anchor-meta,.anchor-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:18px; }
  .guidance-card h2 { margin:5px 0 18px; }
  .guidance-steps { display:grid; gap:8px; }
  .guidance-steps>div { min-height:58px; display:grid; grid-template-columns:36px 1fr; gap:10px; align-items:center; padding:10px 12px; border:1px solid var(--line); border-radius:var(--radius-sm); background:var(--surface-soft); }
  .guidance-steps strong { width:32px; height:32px; display:grid; place-items:center; border-radius:11px; background:var(--surface-blue); color:var(--brand-blue-ink); }
  @media(min-width:720px){ .guidance-steps { grid-template-columns:repeat(3,1fr); } .guidance-steps>div { grid-template-columns:36px 1fr; } }
</style>

import { expect, test } from '@playwright/test';

test('keyboard users encounter the skip link before application navigation', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');

  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveAttribute('href', '#main-content');
});

test('the active primary destination is exposed with aria-current', async ({ page }) => {
  await page.goto('/map');

  const activeMapLinks = page.locator('a[aria-current="page"]').filter({ hasText: 'Map' });
  await expect(activeMapLinks.first()).toBeVisible();
  expect(await activeMapLinks.count()).toBeGreaterThanOrEqual(1);
});

test('the application shell does not introduce root horizontal overflow', async ({ page }) => {
  await page.goto('/');

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});

test('a selected third-floor room produces guided cross-floor instructions entirely client-side', async ({ page }) => {
  await page.goto('/map?room=mb304');
  await expect(page.getByText('MB 304', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Directions' }).click();

  const guide = page.getByLabel('Turn-by-turn directions');
  await expect(guide).toBeVisible();
  await expect(guide.getByText(/Step 1 of/i)).toBeVisible();
  await expect(guide.getByText(/Start at/i).first()).toBeVisible();
  await expect(guide.getByText(/Stairs to the Second Floor|Stairs to the Third Floor/i).first()).toBeVisible();

  const viewport = page.getByRole('region', { name: /Ground Floor interactive map viewport/i });
  expect(await viewport.locator('.route').count()).toBeGreaterThan(0);
});

test('route Next control advances instructions and synchronizes the visible floor', async ({ page }) => {
  await page.goto('/map?room=mb304');
  await page.getByRole('button', { name: 'Directions' }).click();

  const guide = page.getByLabel('Turn-by-turn directions');
  const next = guide.getByRole('button', { name: 'Next' });
  let reachedSecondFloor = false;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (await page.getByRole('button', { name: '2nd' }).getAttribute('aria-pressed') === 'true') {
      reachedSecondFloor = true;
      break;
    }
    if (await next.isDisabled()) break;
    await next.click();
  }

  expect(reachedSecondFloor).toBe(true);
  await expect(page.getByRole('region', { name: /Second Floor interactive map viewport/i })).toBeVisible();
});

test('map camera exposes keyboard zoom and fit without requiring drag', async ({ page }) => {
  await page.goto('/map');

  const viewport = page.getByRole('region', { name: /Ground Floor interactive map viewport/i });
  const svg = viewport.locator('svg');
  await viewport.focus();

  const initialViewBox = await svg.getAttribute('viewBox');
  await page.keyboard.press('+');
  const zoomedViewBox = await svg.getAttribute('viewBox');
  expect(zoomedViewBox).not.toEqual(initialViewBox);

  await page.keyboard.press('0');
  const fittedViewBox = await svg.getAttribute('viewBox');
  expect(fittedViewBox).not.toEqual(zoomedViewBox);
});

test('camera viewBox follows the rendered viewport aspect ratio on portrait phones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/map');

  const viewport = page.getByRole('region', { name: /Ground Floor interactive map viewport/i });
  const svg = viewport.locator('svg');
  await expect(viewport).toBeVisible();

  const viewBox = (await svg.getAttribute('viewBox'))!.split(/\s+/).map(Number);
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  expect(viewBox[2] / viewBox[3]).toBeCloseTo(box!.width / box!.height, 1);
});

test('room search follows the editable combobox keyboard contract', async ({ page }) => {
  await page.goto('/map');

  const search = page.getByRole('combobox', { name: 'Search the Math Building' });
  await search.fill('MB 304');
  await expect(search).toHaveAttribute('aria-expanded', 'true');

  await search.press('ArrowDown');
  await expect(search).toHaveAttribute('aria-activedescendant', /room-search-option-/);
  await search.press('Enter');

  await expect(page.getByRole('button', { name: '3rd' })).toHaveAttribute('aria-pressed', 'true');
  const viewport = page.getByRole('region', { name: /Third Floor interactive map viewport/i });
  await expect(viewport.locator('[role="button"][aria-label^="MB 304"]')).toHaveAttribute('aria-pressed', 'true');
});

test('Escape dismisses room suggestions without destroying the typed query', async ({ page }) => {
  await page.goto('/map');
  const search = page.getByRole('combobox', { name: 'Search the Math Building' });
  await search.fill('Math');
  await expect(search).toHaveAttribute('aria-expanded', 'true');
  await search.press('Escape');
  await expect(search).toHaveAttribute('aria-expanded', 'false');
  await expect(search).toHaveValue('Math');
});

test('mobile selected-place information overlays the map in a collapsible bottom sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/map?room=mb209');

  const toggle = page.getByRole('button', { name: 'Expand selected place details' });
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  const panel = page.getByLabel('Selected destination');
  await expect(panel).toHaveCSS('position', 'absolute');

  await toggle.click();
  await expect(page.getByRole('button', { name: 'Collapse selected place details' })).toHaveAttribute('aria-expanded', 'true');
  await expect(panel.getByRole('link', { name: 'Room details' })).toBeVisible();
});

test('keyboard-focused rooms are kept above the mobile place sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/map?room=mb209');

  const viewport = page.getByRole('region', { name: /Second Floor interactive map viewport/i });
  const room = viewport.locator('[role="button"][aria-label^="MB 209"]');
  const panel = page.getByLabel('Selected destination');
  await room.focus();

  const roomBox = await room.boundingBox();
  const panelBox = await panel.boundingBox();
  expect(roomBox).not.toBeNull();
  expect(panelBox).not.toBeNull();
  expect(roomBox!.y + roomBox!.height).toBeLessThanOrEqual(panelBox!.y + 2);
});

test('poster-derived exits are visibly labeled as unverified instead of authoritative safety data', async ({ page }) => {
  await page.goto('/map');
  const legend = page.getByText('Legend', { exact: true });
  await legend.click();
  await expect(page.getByText(/Poster-marked exit · unverified/i)).toBeVisible();
});

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

test('a selected third-floor room can produce a directional cross-floor route entirely client-side', async ({ page }) => {
  await page.goto('/map?room=mb304');
  await expect(page.getByText('MB 304', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Directions' }).click();

  const routeStrip = page.getByLabel('Active route floor segments');
  await expect(routeStrip).toBeVisible();
  await expect(routeStrip.getByText(/Route crosses 3 floors/i)).toBeVisible();
  await expect(routeStrip.getByRole('button', { name: /Ground/ })).toBeVisible();
  await expect(routeStrip.getByRole('button', { name: /2nd/ })).toBeVisible();
  await expect(routeStrip.getByRole('button', { name: /3rd/ })).toBeVisible();

  const viewport = page.getByRole('region', { name: /Ground Floor interactive map viewport/i });
  expect(await viewport.locator('.route').count()).toBeGreaterThan(0);
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

test('room search switches floors and focuses the selected room', async ({ page }) => {
  await page.goto('/map');

  const search = page.getByRole('searchbox', { name: 'Search the Math Building' });
  await search.fill('MB 304');
  await page.getByRole('button', { name: /MB 304/ }).first().click();

  await expect(page.getByRole('button', { name: '3rd' })).toHaveAttribute('aria-pressed', 'true');
  const viewport = page.getByRole('region', { name: /Third Floor interactive map viewport/i });
  await expect(viewport.locator('[role="button"][aria-label^="MB 304"]')).toHaveAttribute('aria-pressed', 'true');
});

test('mobile selected-place information stays in a collapsible bottom sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/map?room=mb209');

  const toggle = page.getByRole('button', { name: 'Expand selected place details' });
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  const panel = page.getByLabel('Selected destination');
  await expect(panel).toHaveCSS('position', 'sticky');

  await toggle.click();
  await expect(page.getByRole('button', { name: 'Collapse selected place details' })).toHaveAttribute('aria-expanded', 'true');
  await expect(panel.getByRole('link', { name: 'Room details' })).toBeVisible();
});

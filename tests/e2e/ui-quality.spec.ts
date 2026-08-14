import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function waitForHydration(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
}

for (const path of ['/', '/search?q=MB304', '/map?room=mb304', '/tools/grades']) {
  test(`${path} has no automatically detectable accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('map exposes visible controls equivalent to touch gestures', async ({ page }) => {
  await page.goto('/map');
  await waitForHydration(page);
  const zoom = page.getByText('100%', { exact: true });
  await expect(zoom).toBeVisible();
  await page.getByRole('button', { name: 'Zoom map in' }).click();
  await expect(page.getByText('120%', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Fit' }).click();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
});

test('shell remains usable at the release viewport matrix', async ({ page }) => {
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      mainBottomPadding: getComputedStyle(document.querySelector('[data-app-shell]')!).paddingBottom
    }));
    expect(metrics.overflow, `horizontal overflow at ${viewport.width}px`).toBeLessThanOrEqual(1);
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();

    if (viewport.width < 940) {
      expect(Number.parseFloat(metrics.mainBottomPadding)).toBeGreaterThan(76);
    }
  }
});

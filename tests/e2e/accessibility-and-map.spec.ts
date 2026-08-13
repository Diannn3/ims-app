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

test('a selected third-floor room can produce a cross-floor route entirely client-side', async ({ page }) => {
  await page.goto('/map?room=mb304');
  await expect(page.getByText('MB 304', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: /Route from/i }).click();

  const routeStrip = page.getByLabel('Route floor segments');
  await expect(routeStrip).toBeVisible();
  await expect(routeStrip.getByText('Follow the highlighted floor segments')).toBeVisible();
  await expect(routeStrip.getByRole('button', { name: /Ground/ })).toBeVisible();
  await expect(routeStrip.getByRole('button', { name: /2nd/ })).toBeVisible();
  await expect(routeStrip.getByRole('button', { name: /3rd/ })).toBeVisible();
});

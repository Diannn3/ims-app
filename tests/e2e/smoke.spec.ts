import { expect, test } from '@playwright/test';

test('public shell exposes the core navigation and accessible main target', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#main-content')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Map' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Academics' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'People' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tools' }).first()).toBeVisible();
});

test('room finder can deep-link to MB 304', async ({ page }) => {
  await page.goto('/map?room=mb304');
  await expect(page.getByText('MB 304', { exact: true }).first()).toBeVisible();
});

test('universal search resolves compact room IDs without an academic database', async ({ page }) => {
  await page.goto('/search?q=MB304');
  const result = page.getByRole('link', { name: /MB 304/i }).first();
  await expect(result).toBeVisible();
});

test('grade calculator is available without authentication', async ({ page }) => {
  await page.goto('/tools/grades');
  await expect(page.getByRole('heading', { name: /grade/i }).first()).toBeVisible();
});

test('public academic pages render a deliberate empty state when Supabase is not configured', async ({ page }) => {
  await page.goto('/academics');
  await expect(page.getByText(/not connected|no published/i).first()).toBeVisible();
});

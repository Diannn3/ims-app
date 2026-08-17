import { expect, test, type Page } from '@playwright/test';

const integrationEnabled = process.env.INTEGRATION_SUPABASE === '1';
const adminCredentials = {
  email: 'admin.integration@example.test',
  password: 'IMS-Local-Admin-2026!'
};
const editorCredentials = {
  email: 'editor.integration@example.test',
  password: 'IMS-Local-Editor-2026!'
};

async function signIn(page: Page, credentials: { email: string; password: string }, next = '/admin') {
  await page.goto(`/staff/sign-in?next=${encodeURIComponent(next)}`);
  await page.getByLabel('Staff email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in to staff workspace' }).click();
  await expect(page).toHaveURL(new RegExp(`${next.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
}

async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/$/);
}

function scheduleCsv(sectionCode: string, sourceRecordKey: string) {
  return [
    'course_code,section_code,days,start_time,end_time,room,faculty_name,faculty_email,source_record_key',
    `DEMO 101,${sectionCode},M,15:00,16:00,MB 304,Prof. Demo Alpha,demo.alpha@example.edu,${sourceRecordKey}`
  ].join('\n');
}

test.describe('seeded local Supabase integration', () => {
  test.skip(!integrationEnabled, 'Requires the local Supabase integration workflow.');

  test('public academic path connects course → faculty → room → map', async ({ page }) => {
    await page.goto('/course/DEMO%20101');

    await expect(page.getByRole('heading', { name: 'Demo Mathematical Analysis' })).toBeVisible();
    await expect(page.getByText('Section', { exact: true }).first()).toBeVisible();

    const professor = page.getByRole('link', { name: 'Prof. Demo Alpha' }).first();
    await expect(professor).toBeVisible();
    await professor.click();

    await expect(page.getByRole('heading', { name: 'Prof. Demo Alpha' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'MB 205', exact: true })).toBeVisible();
    await expect(page.getByText('Consultation hours', { exact: true })).toBeVisible();

    await page.goto('/room/mb304');
    await expect(page.getByText('DEMO 101', { exact: true }).first()).toBeVisible();
    await page.getByRole('link', { name: 'View on map' }).click();
    await expect(page).toHaveURL(/\/map\?room=mb304/);
    await expect(page.getByRole('heading', { name: 'MB 304', exact: true })).toBeVisible();
  });

  test('unpublished synthetic records remain invisible to public academic reads', async ({ page }) => {
    const response = await page.goto('/course/DEMO%20999');
    expect(response?.status()).toBe(404);
  });

  test('approved local admin can enter the restricted data workspace', async ({ page }) => {
    await signIn(page, adminCredentials);

    await expect(page.getByRole('heading', { name: 'Data health' })).toBeVisible();
    await expect(page.getByText('Academic Core · data-ready')).toBeVisible();
  });

  test('ordinary public browsing never requires a staff session', async ({ page }) => {
    await page.goto('/academics');
    await expect(page.getByRole('heading', { name: 'Academic hub', exact: true })).toBeVisible();
    await expect(page).not.toHaveURL(/staff\/sign-in/);
  });

  test('schedule governance is fail-closed from CSV staging through editor verification and admin publication', async ({ page }) => {
    // The integration database is reset by the workflow before this file runs. A
    // run-specific section/source key also keeps local manual reruns independent.
    const stamp = Date.now().toString().slice(-8);
    const sectionCode = `E2E${stamp}`;
    const sourceRecordKey = `governance-${stamp}`;

    // 1. An admin stages a validated CSV and performs the transactional apply.
    await signIn(page, adminCredentials, '/admin/imports');
    await expect(page.getByRole('heading', { name: 'Schedule imports' })).toBeVisible();

    await page.locator('select[name="sourceId"]').selectOption({ index: 1 });
    await page.locator('select[name="termId"]').selectOption({ index: 1 });
    await page.getByLabel('Schedule CSV').setInputFiles({
      name: 'governance-e2e.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(scheduleCsv(sectionCode, sourceRecordKey), 'utf8')
    });
    await page.getByRole('button', { name: 'Stage & validate' }).click();

    await expect(page).toHaveURL(/\/admin\/imports\/[0-9a-f-]+$/i);
    await expect(page.getByText('Validation passed')).toBeVisible();
    await expect(page.getByText('0 warnings', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Apply reviewed batch' })).toBeEnabled();
    await page.getByRole('button', { name: 'Apply reviewed batch' }).click();
    await expect(page).toHaveURL(/\/admin\/imports\/[0-9a-f-]+\?applied=1$/i);
    await expect(page.getByText('Batch applied.', { exact: false })).toBeVisible();

    // Fail-closed proof must be observed as an anonymous reader. Staff roles may
    // legitimately see unpublished review data through their own RLS policies.
    await page.goto('/admin');
    await signOut(page);
    await page.goto('/course/DEMO%20101');
    await expect(page.getByText(sectionCode, { exact: true })).toHaveCount(0);

    // 2. A content editor can verify the schedule but cannot publish it.
    await signIn(page, editorCredentials, '/admin/review');

    const editorCard = page.locator('article.review-card').filter({ hasText: `DEMO 101 · Section ${sectionCode}` });
    await expect(editorCard).toBeVisible();
    await expect(editorCard.getByRole('button', { name: 'Verify schedule' })).toBeVisible();
    await expect(editorCard.getByRole('button', { name: 'Publish' })).toHaveCount(0);
    await expect(editorCard.getByText('Only administrators can publish.')).toBeVisible();

    await editorCard.getByRole('button', { name: 'Verify schedule' }).click();
    await expect(page.getByText('Schedule verified.', { exact: true })).toBeVisible();
    await expect(editorCard.getByText('Review · verified')).toBeVisible();
    await expect(editorCard.getByText('Only administrators can publish.')).toBeVisible();

    // Verification by itself is still not public publication. Check that boundary
    // after leaving the reviewer session rather than relying on staff RLS behavior.
    await page.goto('/admin');
    await signOut(page);
    await page.goto('/course/DEMO%20101');
    await expect(page.getByText(sectionCode, { exact: true })).toHaveCount(0);

    // 3. Only an admin can explicitly publish the already-verified schedule.
    await signIn(page, adminCredentials, '/admin/review');

    const adminCard = page.locator('article.review-card').filter({ hasText: `DEMO 101 · Section ${sectionCode}` });
    await expect(adminCard).toBeVisible();
    await expect(adminCard.getByText('Review · verified')).toBeVisible();
    await expect(adminCard.getByRole('button', { name: 'Publish' })).toBeEnabled();
    await adminCard.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Schedule published.', { exact: true })).toBeVisible();
    await expect(adminCard.getByText('Visibility · published')).toBeVisible();

    // 4. The public read model now exposes the reviewed schedule and canonical room.
    await page.goto('/course/DEMO%20101');
    await expect(page.getByText(sectionCode, { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'MB 304' }).last()).toBeVisible();
  });
});

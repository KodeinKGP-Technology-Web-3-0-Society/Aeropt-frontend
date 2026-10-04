import { test, expect, type Page } from '@playwright/test';

// Needs the full stack running (frontend :3000, backend :8000, agent :8001).
// Set STUDY_SHOTS=<dir> to save a screenshot at each step for visual review.
const shotsDir = process.env.STUDY_SHOTS;
async function shot(page: Page, name: string) {
  if (shotsDir) await page.screenshot({ path: `${shotsDir}/${name}.png`, fullPage: false });
}

async function signUp(page: Page) {
  await page.goto('/study');
  await page.getByRole('button', { name: 'Create an account', exact: true }).click();
  await page.getByLabel('Full name').fill('Playwright Test');
  await page.getByLabel('Email Address').fill(`test-${Date.now()}@example.com`);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  await page.waitForURL(/\/(onboarding|home)/, { timeout: 20_000 }).catch(() => null);
}

test.describe('Study Room', () => {
  test.setTimeout(6 * 60_000);

  test('resolves a typed topic, teaches, and keeps the conversation going', async ({ page }) => {
    await signUp(page);

    await page.goto('/study');
    const topic = page.getByLabel('Topic');
    await expect(topic).toBeVisible();
    // Physics only — no chemistry or maths suggestions.
    await expect(page.getByRole('button', { name: 'Chemical bonding' })).toHaveCount(0);
    await shot(page, '01-study-index');

    await topic.fill('LC oscillation');
    await topic.press('Enter');
    await expect(page).toHaveURL(/\/study\/LC%20oscillation/);

    // The typed phrase resolves to the real concept, with its chapter.
    await expect(page.getByRole('heading', { level: 1, name: 'LC circuit' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Inductance').first()).toBeVisible();
    await expect(page.getByText('Not what you meant?')).toBeVisible();
    await shot(page, '02-welcome');

    await page.getByRole('button', { name: /Start the (lesson|recap)/ }).click();
    await expect(page.getByRole('status')).toBeVisible();
    await shot(page, '03-working');

    // First lesson part arrives and ends with a question for the student.
    const notes = page.locator('article.study-notes');
    await expect(notes.first()).toBeVisible({ timeout: 120_000 });
    await expect(notes.first()).not.toBeEmpty();
    await shot(page, '04-first-reply');

    const composer = page.getByLabel('Message your tutor');
    await composer.fill('The current is maximum when the charge on the capacitor is zero.');
    await composer.press('Enter');
    await expect(notes).toHaveCount(2, { timeout: 120_000 });
    await shot(page, '05-second-reply');

    // Reloading resumes the same session with its transcript instead of starting over.
    await page.reload();
    await expect(page.getByText('Picked up where you left off')).toBeVisible({ timeout: 20_000 });
    await expect(notes).toHaveCount(2);
    await shot(page, '06-resumed');
  });
});

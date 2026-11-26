import { test, expect } from '@playwright/test';

test('home page loads on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
  await page.screenshot({ path: '../../screenshots/smoke-375.png', fullPage: true, caret: 'initial' });
});

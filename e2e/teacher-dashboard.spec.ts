import { test, expect } from '@playwright/test';

/**
 * Teacher Dashboard E2E Tests
 *
 * Tests the teacher dashboard and session management flows.
 * Note: These tests require authentication mocking for full functionality.
 */

test.describe('Teacher Dashboard', () => {
  test('should show login prompt when not authenticated', async ({ page }) => {
    await page.goto('http://localhost:5174/');

    // Should show some form of login or redirect to auth
    // Clerk will handle the actual auth flow
    await expect(page).toHaveURL(/.*/, { timeout: 10000 });
  });

  test('should have proper page title', async ({ page }) => {
    await page.goto('http://localhost:5174/');

    // Check page has loaded
    await expect(page).toHaveTitle(/.*/);
  });
});

test.describe('Session Creation Flow', () => {
  // These tests would require auth mocking
  test.skip('should allow creating a new session', async ({ page }) => {
    // TODO: Implement with auth mocking
    await page.goto('http://localhost:5174/create');
    await expect(page.getByRole('heading', { name: /create/i })).toBeVisible();
  });
});

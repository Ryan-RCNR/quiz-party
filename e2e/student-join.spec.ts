import { test, expect } from '@playwright/test';

/**
 * Student Join Flow E2E Tests
 *
 * Tests the student journey from landing page to joining a game session.
 */

test.describe('Student Join Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display join page with game code input', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByPlaceholder(/game code/i)).toBeVisible();
    await expect(page.getByPlaceholder(/your name/i)).toBeVisible();
  });

  test('should validate game code format', async ({ page }) => {
    const codeInput = page.getByPlaceholder(/game code/i);
    const nameInput = page.getByPlaceholder(/your name/i);
    const joinButton = page.getByRole('button', { name: /join/i });

    // Enter invalid code (lowercase)
    await codeInput.fill('abc123');
    await nameInput.fill('TestPlayer');
    await joinButton.click();

    // Should show validation error or transform to uppercase
    const codeValue = await codeInput.inputValue();
    expect(codeValue).toMatch(/^[A-Z0-9]+$/);
  });

  test('should require both game code and name', async ({ page }) => {
    const joinButton = page.getByRole('button', { name: /join/i });

    // Button should be disabled or show error without inputs
    await joinButton.click();

    // Should still be on join page
    await expect(page).toHaveURL('/');
  });

  test('should show error for invalid session code', async ({ page }) => {
    const codeInput = page.getByPlaceholder(/game code/i);
    const nameInput = page.getByPlaceholder(/your name/i);
    const joinButton = page.getByRole('button', { name: /join/i });

    await codeInput.fill('INVALID');
    await nameInput.fill('TestPlayer');
    await joinButton.click();

    // Should show error message (session not found)
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  });

  test('should have accessible form elements', async ({ page }) => {
    // Check for proper labels
    const codeInput = page.getByPlaceholder(/game code/i);
    const nameInput = page.getByPlaceholder(/your name/i);

    await expect(codeInput).toBeEnabled();
    await expect(nameInput).toBeEnabled();

    // Check keyboard navigation
    await codeInput.focus();
    await page.keyboard.press('Tab');
    await expect(nameInput).toBeFocused();
  });
});

test.describe('Student Play Page', () => {
  test('should redirect to join if no session', async ({ page }) => {
    // Try to access play page directly without a session
    await page.goto('/play/TEST123');

    // Should redirect to join page
    await expect(page).toHaveURL(/\/join/);
  });
});

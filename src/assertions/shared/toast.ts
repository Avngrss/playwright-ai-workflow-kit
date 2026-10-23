import { expect, type Page } from "@playwright/test";

/**
 * A message the app announces after an action — a toast, a snackbar or an alert (role "alert" or
 * "status"), found by its text. Checked right after the action, as the next line: a toast closes
 * itself after a few seconds. Never the only proof — the test also checks what the action left
 * behind (the saved row, the changed value). Never closed or waited away by a test.
 */
export async function expectToast(page: Page, text: string | RegExp): Promise<void> {
  const message = page.locator("[role=alert], [role=status]").filter({ hasText: text }).first();
  await expect(message, `Message "${text}"`).toBeVisible();
}

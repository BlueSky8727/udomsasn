import { expect, test } from '@playwright/test';

test('ผู้ใช้ที่ยังไม่เข้าสู่ระบบถูกส่งไปหน้าเข้าสู่ระบบ', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
});

test('อาจารย์เข้าสู่ระบบและถูกปฏิเสธจากหน้าผู้ดูแลระบบ', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#email').fill('teacher@udomsasn.ac.th');
  await page.locator('#password').fill('Udomsasn@2026');
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('a[href="/submit"]').first()).toBeVisible();

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/forbidden$/);
});

test('ผู้ดูแลระบบเปิดรายชื่อบุคลากรและค้นหาผ่านเซิร์ฟเวอร์ได้', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#email').fill('admin@udomsasn.ac.th');
  await page.locator('#password').fill('Udomsasn@2026');
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/$/);
  await page.goto('/admin?q=teacher');
  await expect(page).toHaveURL(/\/admin\?q=teacher$/);
  await expect(page.locator('form[action="/admin"] input[name="q"]').first()).toHaveValue('teacher');
  await expect(page.getByText('teacher@udomsasn.ac.th')).toBeVisible();
});

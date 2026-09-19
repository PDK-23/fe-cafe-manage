import { test, expect, type Page } from '@playwright/test'

async function login(page: Page, username = 'admin', password = 'Cafe@Admin2026') {
  await page.goto('/dang-nhap')
  await page.getByLabel('Tên đăng nhập').fill(username)
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Sơ đồ bàn' })).toBeVisible()
}

test('admin cấp và thu hồi quyền báo cáo cho thu ngân qua giao diện', async ({
  page,
  browser,
  request,
}) => {
  await login(page)
  await page.getByRole('link', { name: 'Phân quyền', exact: true }).click()
  const report = page.getByRole('checkbox', { name: 'Báo cáo doanh thu', exact: true })
  await expect(report).not.toBeChecked()
  const cashierContext = await browser.newContext()
  const cashier = await cashierContext.newPage()
  await login(cashier, 'cashier', 'Cafe@Cashier2026')
  await expect(cashier.getByRole('link', { name: 'Báo cáo', exact: true })).toHaveCount(0)
  await report.check()
  await page.getByRole('button', { name: 'Lưu phân quyền', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Lưu phân quyền', exact: true })).toBeDisabled()
  await page.reload()
  await expect(report).toBeChecked()
  await cashier.reload()
  await cashier.getByRole('link', { name: 'Báo cáo', exact: true }).click()
  await expect(
    cashier.getByRole('heading', { name: 'Báo cáo doanh thu', exact: true }),
  ).toBeVisible()
  await expect(cashier.locator('.metrics-grid')).toBeVisible()
  await page.screenshot({ path: 'test-results/roles-desktop.png', fullPage: true })
  await report.uncheck()
  await page.getByRole('button', { name: 'Lưu phân quyền', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Lưu phân quyền', exact: true })).toBeDisabled()
  await cashier.reload()
  await expect(cashier.getByRole('heading', { name: 'Trang không khả dụng' })).toBeVisible()
  const token = await cashier.evaluate(
    () => JSON.parse(sessionStorage.getItem('cafe-flow-session')!).state.token,
  )
  const headers = { Authorization: `Bearer ${token}` }
  expect((await request.get('/api/pos/reports', { headers })).status()).toBe(403)
  expect(
    (
      await request.put('/api/permissions/roles/MANAGER', { headers, data: { permissions: [] } })
    ).status(),
  ).toBe(403)
  await cashierContext.close()
})

test('lưu quyền lỗi giữ lựa chọn để thử lại và chuyển vai trò giữ bản nháp', async ({ page }) => {
  await login(page)
  await page.goto('/phan-quyen')
  await page.getByRole('checkbox', { name: 'Báo cáo doanh thu', exact: true }).check()
  await page.getByRole('button', { name: /Quản lý Điều hành/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Quản lý được sử dụng chức năng nào?' }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Thu ngân Nhân viên/ }).click()
  await expect(page.getByRole('checkbox', { name: 'Báo cáo doanh thu', exact: true })).toBeChecked()
  await page.route('**/api/permissions/roles/CASHIER', async (route) => {
    if (route.request().method() === 'PUT')
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"message":"Không thể lưu quyền lúc này"}',
      })
    else await route.continue()
  })
  await page.getByRole('button', { name: 'Lưu phân quyền', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Không thể lưu quyền lúc này')
  await expect(page.getByRole('checkbox', { name: 'Báo cáo doanh thu', exact: true })).toBeChecked()
  await expect(page.getByRole('button', { name: 'Lưu phân quyền', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Bỏ thay đổi' }).click()
})

test('POS rộng và dễ đọc ở desktop, tablet và mobile', async ({ page }) => {
  await login(page)
  for (const [width, height] of [
    [1440, 900],
    [1280, 800],
    [1024, 768],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy()
    const dimensions = await page.evaluate(() => ({
      order: document.querySelector('.order-panel')!.getBoundingClientRect().width,
      layout: document.querySelector('.pos-layout')!.getBoundingClientRect().width,
      productFont: parseFloat(
        getComputedStyle(document.querySelector('.product-item h3')!).fontSize,
      ),
    }))
    expect(dimensions.productFont).toBeGreaterThanOrEqual(16)
    if (width >= 1280) expect(dimensions.order / dimensions.layout).toBeGreaterThan(0.4)
    await page.screenshot({ path: `test-results/pos-${width}.png`, fullPage: true })
  }
  await page.goto('/phan-quyen')
  await expect(page.getByRole('checkbox', { name: 'Báo cáo doanh thu', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.screenshot({ path: 'test-results/roles-mobile.png', fullPage: true })
})

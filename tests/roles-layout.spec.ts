import { test, expect, type Page } from '@playwright/test'
import type { Table } from '../src/models/types'

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
  await page.getByRole('radio', { name: /Quản lý Điều hành/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Quản lý được sử dụng chức năng nào?' }),
  ).toBeVisible()
  await page.getByRole('radio', { name: /Thu ngân Nhân viên/ }).click()
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
  await expect(page.locator('[data-sonner-toast][data-type="error"]')).toContainText(
    'Không thể lưu quyền lúc này',
  )
  await expect(page.getByRole('checkbox', { name: 'Báo cáo doanh thu', exact: true })).toBeChecked()
  await expect(page.getByRole('button', { name: 'Lưu phân quyền', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Bỏ thay đổi' }).click()
})

test('POS rộng và dễ đọc ở desktop, tablet và mobile', async ({ page }) => {
  await login(page)
  for (const [width, height] of [
    [1440, 900],
    [1280, 800],
    [1366, 768],
    [1024, 768],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height })
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight),
    ).toBeTruthy()
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

test('danh sách nhiều món có đủ chiều cao và cuộn riêng khỏi thanh toán', async ({ page }) => {
  // Use a long order fixture without changing any stored orders.
  let tableName = ''
  await page.route('**/api/pos/tables', async (route) => {
    const response = await route.fetch()
    const tables: Table[] = await response.json()
    const table = tables.find((item) => item.order)!
    tableName = table.name
    const order = table.order!
    order.items = Array.from({ length: 12 }, (_, index) => ({
      productId: 1000 + index,
      name: `Cà phê kiểm thử ${index + 1}`,
      price: 25000,
      quantity: 1,
      note: index === 0 ? 'Ít đường, ít đá. '.repeat(8) : '',
    }))
    order.subtotal = 300000
    order.total = 300000
    await route.fulfill({ response, json: tables })
  })
  await login(page)
  await page.getByRole('button', { name: `${tableName} Có khách`, exact: true }).click()
  await expect(page.locator('.order-line')).toHaveCount(12)
  await expect(page.locator('.customer-picker')).toHaveCSS('border-top-style', 'dashed')
  await expect(page.locator('.table-card').filter({ hasText: tableName })).toHaveCSS(
    'border-top-width',
    '1px',
  )
  for (const [width, height] of [
    [1440, 900],
    [1280, 800],
    [1366, 768],
    [1024, 768],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height })
    if (width < 1200) await page.getByRole('radio', { name: /Đơn hàng/ }).click()
    const viewport = page.locator('.order-items [data-slot="scroll-area-viewport"]')
    const summary = page.locator('.order-summary')
    const dimensions = await viewport.boundingBox()
    expect(dimensions!.height).toBeGreaterThanOrEqual(240)
    expect(await viewport.evaluate((el) => el.scrollHeight > el.clientHeight)).toBeTruthy()
    const before = await summary.boundingBox()
    await viewport.evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
    const last = await page.locator('.order-line').last().boundingBox()
    const after = await summary.boundingBox()
    expect(last!.y + last!.height).toBeLessThanOrEqual(dimensions!.y + dimensions!.height + 1)
    expect(Math.abs(after!.y - before!.y)).toBeLessThan(1)
    expect(after!.y).toBeGreaterThanOrEqual(dimensions!.y + dimensions!.height - 1)
    const panel = await page.locator('.order-panel').boundingBox()
    const checkout = page.getByRole('button', { name: 'Thanh toán', exact: true })
    const button = await checkout.boundingBox()
    expect(button!.y + button!.height).toBeLessThanOrEqual(panel!.y + panel!.height)
    expect(button!.y + button!.height).toBeLessThanOrEqual(height)
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight),
    ).toBeTruthy()
    await expect(checkout).toHaveCSS('background-color', 'rgb(20, 117, 104)')
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy()
    await viewport.evaluate((el) => {
      el.scrollTop = 0
    })
    await page.screenshot({ path: `test-results/order-scroll-${width}.png`, fullPage: true })
  }
})

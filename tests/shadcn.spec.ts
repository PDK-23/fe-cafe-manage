import { test, expect, type Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('/dang-nhap')
  await page.getByLabel('Tên đăng nhập').fill('admin')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Cafe@Admin2026')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Sơ đồ bàn' })).toBeVisible()
}

test('các màn hình shadcn hiển thị ở desktop và mobile, menu mobile đóng khi chuyển trang', async ({
  page,
}) => {
  await login(page)
  for (const width of [1440, 1280, 1024, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 768 })
    for (const path of [
      'thuc-don',
      'khach-hang',
      'nhan-vien',
      'phan-quyen',
      'hoa-don',
      'bao-cao',
      'tat-toan',
    ]) {
      await page.goto(`/${path}`)
      await expect(page.locator('main h1')).toBeVisible()
      await expect(page.getByRole('status').filter({ hasText: 'Đang tải dữ liệu...' })).toHaveCount(
        0,
      )
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBeTruthy()
      expect(
        await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight),
      ).toBeTruthy()
      if (path === 'thuc-don') {
        const scroll = page.locator('[data-slot="table-container"]')
        expect(await scroll.evaluate((el) => el.scrollHeight > el.clientHeight)).toBeTruthy()
        await page.locator('tbody tr').last().scrollIntoViewIfNeeded()
        await expect(page.locator('tbody tr').last()).toBeInViewport()
        await expect(page.locator('thead')).toBeInViewport()
        expect(await page.evaluate(() => scrollY)).toBe(0)
      }
      if (path === 'phan-quyen') {
        await page
          .getByRole('checkbox', { name: 'Tất toán ca', exact: true })
          .scrollIntoViewIfNeeded()
        await expect(
          page.getByRole('button', { name: 'Lưu phân quyền', exact: true }),
        ).toBeInViewport()
        expect(await page.evaluate(() => scrollY)).toBe(0)
      }
      await page.screenshot({ path: `test-results/shadcn-${path}-${width}.png`, fullPage: true })
    }
  }
  await page.getByRole('button', { name: 'Mở/thu gọn menu' }).click()
  await expect(page.locator('[data-sidebar="sidebar"][data-mobile="true"]')).toHaveCSS(
    'background-color',
    'rgb(16, 76, 69)',
  )
  await page.getByRole('link', { name: 'Khách hàng', exact: true }).click()
  await expect(page.locator('main h1')).toHaveText('Khách hàng')
  await expect(page.locator('[data-slot="sheet-content"]')).toHaveCount(0)
})

test('tab, checkbox biểu mẫu, hộp thoại bàn phím và in lại hóa đơn', async ({ page }) => {
  await login(page)
  await page.goto('/thuc-don')
  await page.getByRole('tab', { name: 'Danh mục', exact: true }).click()
  await expect(page.getByRole('columnheader', { name: 'Tên danh mục' })).toBeVisible()
  await page.getByRole('tab', { name: 'Danh sách món', exact: true }).click()
  await page.getByRole('button', { name: 'Thêm món mới' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await page.getByLabel('Tên món', { exact: true }).fill('Món shadcn kiểm thử')
  await dialog.getByRole('checkbox').uncheck()
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  const row = page.locator('tbody tr').filter({ hasText: 'Món shadcn kiểm thử' })
  await expect(row).toContainText('Ngừng bán')
  await row.getByRole('button', { name: /Sửa/ }).click()
  await expect(dialog.getByRole('checkbox')).not.toBeChecked()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await row.getByRole('button', { name: /Xóa/ }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page.getByRole('button', { name: 'Giữ lại' }).click()
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: /Xóa/ }).click()
  await page.getByRole('button', { name: 'Xóa dữ liệu' }).click()
  await expect(row).toHaveCount(0)
  await page.goto('/phan-quyen')
  await page.getByRole('checkbox', { name: 'Báo cáo doanh thu', exact: true }).check()
  await page.getByRole('tab', { name: 'Quyền API nâng cao' }).click()
  await expect(page.getByRole('columnheader', { name: 'Đường dẫn API' })).toBeVisible()
  await page.getByRole('tab', { name: 'Cấp quyền theo vai trò' }).click()
  await expect(page.getByRole('checkbox', { name: 'Báo cáo doanh thu', exact: true })).toBeChecked()
  await page.getByRole('button', { name: 'Bỏ thay đổi' }).click()
  await page.goto('/hoa-don')
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click()
  await expect(page.locator('.receipt')).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.receipt')).toBeVisible()
  await expect(page.locator('.app-shell')).not.toBeVisible()
  await expect(page.locator('[data-slot="dialog-overlay"]')).not.toBeVisible()
  expect(await page.locator('.app-dialog').evaluate((el) => getComputedStyle(el).transform)).toBe(
    'none',
  )
  await page.emulateMedia({ media: 'screen' })
  await page.getByRole('button', { name: 'Đóng', exact: true }).last().click()
  await page.goto('/bao-cao')
  await expect(page.locator('[data-slot="chart"] .recharts-bar-rectangle').first()).toBeVisible()
})

test('POS vừa màn hình thấp, chuyển Bàn/Thực đơn/Đơn hàng vẫn giữ đơn và thanh toán được', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 667 })
  await login(page)
  await page.getByRole('button', { name: 'VIP 1 Trống', exact: true }).click()
  await expect(page.getByRole('radio', { name: 'Thực đơn', exact: true })).toBeChecked()
  await page.getByPlaceholder('Tìm món bạn cần...').fill('Bạc xỉu')
  await page.locator('.product-item').click()
  await page.getByRole('radio', { name: /Đơn hàng/ }).click()
  await expect(page.locator('.order-line')).toHaveCount(1)
  await page.getByRole('button', { name: 'Tăng Bạc xỉu' }).click()
  await expect(page.locator('.summary-total strong')).toHaveText(/50\.000/)
  await page.getByRole('radio', { name: 'Bàn', exact: true }).click()
  await page.getByRole('radio', { name: /Đơn hàng/ }).click()
  await expect(page.locator('.quantity b')).toHaveText('2')
  for (const [width, height] of [
    [390, 667],
    [1024, 600],
    [1440, 600],
  ]) {
    await page.setViewportSize({ width, height })
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight),
    ).toBeTruthy()
    const items = await page.locator('.order-items').boundingBox()
    expect(items!.height).toBeGreaterThanOrEqual(120)
    const checkout = await page
      .getByRole('button', { name: 'Thanh toán', exact: true })
      .boundingBox()
    expect(checkout!.y + checkout!.height).toBeLessThanOrEqual(height)
    await page.screenshot({ path: `test-results/frame-${width}-${height}.png` })
  }
  await page.getByRole('button', { name: 'Thanh toán', exact: true }).click()
  await page.getByRole('button', { name: 'Xác nhận thanh toán' }).click()
  await expect(page.locator('.receipt')).toContainText('50.000')
})

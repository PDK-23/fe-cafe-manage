import { test, expect, type APIRequestContext } from '@playwright/test'
async function session(
  request: APIRequestContext,
  username = 'admin',
  password = 'Cafe@Admin2026',
) {
  const login = await request.post('/api/auth/login', { data: { username, password } })
  expect(login.ok()).toBeTruthy()
  const body = await login.json()
  return { Authorization: `Bearer ${body.token}` }
}
test('API: giá từ catalog, chống trả thiếu, thanh toán đồng thời chỉ ghi một hóa đơn', async ({
  request,
}) => {
  const headers = await session(request)
  let response = await request.post('/api/pos/tables/25/items', {
    headers,
    data: { productId: 1, price: 1 },
  })
  expect(response.ok()).toBeTruthy()
  let order = await response.json()
  expect(order.total).toBe(20000)
  response = await request.post(`/api/pos/orders/${order.id}/checkout`, {
    headers,
    data: { version: order.version, method: 'CASH', tendered: 1 },
  })
  expect(response.status()).toBe(400)
  const oldVersion = order.version
  response = await request.post('/api/pos/tables/25/items', { headers, data: { productId: 1 } })
  order = await response.json()
  response = await request.post(`/api/pos/orders/${order.id}/checkout`, {
    headers,
    data: { version: oldVersion, method: 'TRANSFER', tendered: 40000 },
  })
  expect(response.status()).toBe(409)
  const results = await Promise.all(
    [1, 2].map(() =>
      request.post(`/api/pos/orders/${order.id}/checkout`, {
        headers,
        data: { version: order.version, method: 'CASH', tendered: 50000 },
      }),
    ),
  )
  expect(results.filter((r) => r.ok())).toHaveLength(1)
  const invoice = await (await request.get(`/api/pos/invoices/${order.id}`, { headers })).json()
  expect(invoice.total).toBe(40000)
  expect(invoice.change).toBe(10000)
})
test('API: khóa tài khoản thu hồi JWT đang dùng trên các service', async ({ request }) => {
  const headers = await session(request)
  const username = `e2e_${Date.now()}`
  const created = await request.post('/api/auth/users', {
    headers,
    data: {
      username,
      name: 'Kiểm thử khóa tài khoản',
      role: 'CASHIER',
      enabled: true,
      password: 'Cafe@Test2026',
    },
  })
  expect(created.ok()).toBeTruthy()
  const user = await created.json()
  const cashier = await session(request, username, 'Cafe@Test2026')
  expect((await request.get('/api/pos/tables', { headers: cashier })).ok()).toBeTruthy()
  expect(
    (
      await request.put(`/api/auth/users/${user.id}`, {
        headers,
        data: { username, name: user.name, role: 'CASHIER', enabled: false, password: '' },
      })
    ).ok(),
  ).toBeTruthy()
  expect((await request.get('/api/pos/tables', { headers: cashier })).status()).toBe(403)
  expect((await request.get('/api/catalog/products', { headers: cashier })).status()).toBe(403)
  expect(
    (
      await request.post('/api/auth/login', { data: { username, password: 'Cafe@Test2026' } })
    ).status(),
  ).toBe(401)
})
test('API: thay đổi RBAC áp dụng trực tiếp và menu con được lưu', async ({ request }) => {
  const admin = await session(request),
    cashier = await session(request, 'cashier', 'Cafe@Cashier2026')
  expect((await request.get('/api/pos/reports', { headers: cashier })).status()).toBe(403)
  const rule = await (
    await request.post('/api/permissions/rules', {
      headers: admin,
      data: { role: 'CASHIER', method: 'GET', path: '/api/pos/reports' },
    })
  ).json()
  try {
    expect((await request.get('/api/pos/reports', { headers: cashier })).ok()).toBeTruthy()
  } finally {
    await request.delete(`/api/permissions/rules/${rule.id}`, { headers: admin })
  }
  expect((await request.get('/api/pos/reports', { headers: cashier })).status()).toBe(403)
  const menus = await (await request.get('/api/permissions/menus', { headers: admin })).json()
  const parent = menus.find((m: { path: string }) => m.path === '/hoa-don')
  const created = await request.post('/api/permissions/menus', {
    headers: admin,
    data: {
      label: 'Hóa đơn hôm nay',
      path: '/hoa-don',
      icon: 'receipt',
      roles: 'ADMIN,CASHIER',
      parentId: parent.id,
      sortOrder: 20,
    },
  })
  expect(created.ok()).toBeTruthy()
  const menu = await created.json()
  try {
    const visible = await (await request.get('/api/permissions/menus', { headers: cashier })).json()
    expect(visible.some((m: { id: number }) => m.id === menu.id)).toBeTruthy()
  } finally {
    await request.delete(`/api/permissions/menus/${menu.id}`, { headers: admin })
  }
})
test('API: từ chối tất toán khi còn bàn mở và validate dữ liệu', async ({ request }) => {
  const headers = await session(request)
  expect(
    (
      await request.post('/api/pos/day/close', { headers, data: { countedCash: 0, note: 'test' } })
    ).status(),
  ).toBe(400)
  expect(
    (
      await request.post('/api/catalog/products', {
        headers,
        data: { name: 'Invalid', categoryId: 1, price: -1, available: true },
      })
    ).status(),
  ).toBe(400)
  expect(
    (
      await request.post('/api/pos/customers', {
        headers,
        data: { name: 'Test', phone: 'abc', email: 'invalid', note: '' },
      })
    ).status(),
  ).toBe(400)
  expect((await request.get('/api/pos/tables')).status()).toBe(401)
})

import { test, expect } from '@playwright/test'
test('API: đóng ca đối soát tiền mặt, chặn bán khi đóng và mở ca mới', async ({ request }) => {
  const login = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'Cafe@Admin2026' },
  })
  const { token } = await login.json()
  const headers = { Authorization: `Bearer ${token}` }
  const tables = await (await request.get('/api/pos/tables', { headers })).json()
  for (const table of tables) {
    if (!table.order) continue
    const paid = await request.post(`/api/pos/orders/${table.order.id}/checkout`, {
      headers,
      data: { version: table.order.version, method: 'CASH', tendered: table.order.total },
    })
    expect(paid.ok()).toBeTruthy()
  }
  const before = await (await request.get('/api/pos/day', { headers })).json()
  expect(before.openOrders).toBe(0)
  const closed = await request.post('/api/pos/day/close', {
    headers,
    data: { countedCash: before.expectedCash - 1000, note: 'Kiểm thử chênh lệch 1.000đ' },
  })
  expect(closed.ok()).toBeTruthy()
  const day = await closed.json()
  expect(day.current.closedAt).toBeTruthy()
  expect(day.current.countedCash - day.current.expectedCash).toBe(-1000)
  expect(
    (await request.post('/api/pos/tables/1/items', { headers, data: { productId: 1 } })).status(),
  ).toBe(400)
  const opened = await request.post('/api/pos/day/open', { headers, data: { openingCash: 100000 } })
  expect(opened.ok()).toBeTruthy()
  const next = await opened.json()
  expect(next.expectedCash).toBe(100000)
  expect(next.current.closedAt).toBeNull()
  expect(next.sales).toBe(0)
})

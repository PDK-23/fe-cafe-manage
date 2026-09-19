export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER'
export interface User {
  id: number
  username: string
  name: string
  role: Role
  enabled: boolean
}
export interface Menu {
  id: number
  label: string
  path: string
  icon: string
  roles: string
  parentId: number | null
  sortOrder: number
}
export interface Rule {
  id: number
  role: Role
  method: string
  path: string
}
export interface Category {
  id: number
  name: string
}
export interface Product {
  id: number
  name: string
  categoryId: number
  price: number
  available: boolean
  icon: string
}
export interface Customer {
  id: number
  name: string
  phone: string
  email: string
  note: string
}
export interface Line {
  productId: number
  name: string
  quantity: number
  price: number
  note: string
}
export interface Order {
  id: number
  version: number
  tableId: number
  tableName: string
  dayId: number
  customerId: number | null
  customerName: string | null
  status: string
  note: string
  createdAt: string
  paidAt: string | null
  items: Line[]
  discount: number
  surcharge: number
  subtotal: number
  total: number
  tendered: number
  change: number
  paymentMethod: string
  cashier: string
}
export interface Table {
  id: number
  name: string
  area: string
  seats: number
  order: Order | null
}
export interface BusinessDay {
  id: number
  openedAt: string
  closedAt: string | null
  openingCash: number
  countedCash: number | null
  expectedCash: number | null
  note: string
  closedBy: string
}
export interface Day {
  current: BusinessDay
  openOrders: number
  sales: number
  cashSales: number
  expectedCash: number
  history: BusinessDay[]
}
export interface Ranking {
  name: string
  quantity: number
  revenue: number
}
export interface Report {
  revenue: number
  invoiceCount: number
  average: number
  payments: Record<string, number>
  products: Ranking[]
  customers: Ranking[]
  daily: Record<string, number>
}

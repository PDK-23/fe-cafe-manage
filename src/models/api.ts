import { useSession } from '../viewmodels/session'
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = useSession.getState().token
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error('Không thể kết nối máy chủ. Vui lòng kiểm tra các service đang chạy.')
  }
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login') useSession.getState().logout()
    const data = await response.json().catch(() => ({}))
    throw new Error(
      data.message ||
      (
        {
          401: 'Phiên đăng nhập đã hết hạn.',
          403: 'Bạn không có quyền thực hiện thao tác này.',
          502: 'Service chưa sẵn sàng. Vui lòng khởi động backend.',
        } as Record<number, string>
      )[response.status] ||
      'Thao tác thất bại. Vui lòng thử lại.',
    )
  }
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}
export const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
export const dateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value))
export const localDate = () =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
export const paymentNames: Record<string, string> = {
  CASH: 'Tiền mặt',
  TRANSFER: 'Chuyển khoản',
  CARD: 'Thẻ',
}
export const matches = (text: string, search: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .includes(
      search
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .toLowerCase(),
    )

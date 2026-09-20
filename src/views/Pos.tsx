import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { useState, type FormEvent } from 'react'
import {
  Coffee,
  Plus,
  Minus,
  Users,
  ArrowRightLeft,
  Trash2,
  ReceiptText,
  Armchair,
  ChevronRight,
  Banknote,
  Check,
  Clock3,
  NotebookPen,
  Leaf,
  Grid2X2,
  Sun,
  Flower2,
} from 'lucide-react'
import {
  useTables,
  useProducts,
  useCategories,
  useCustomers,
  useAction,
  useDay,
} from '../viewmodels/data'
import { useUI } from '../viewmodels/session'
import type { Order, Table, Line } from '../models/types'
import { money, matches, paymentNames, dateTime } from '../models/api'
import { Modal, SearchBox, Loading, ErrorBox, Empty, Field } from '../components/ui'
import { Receipt } from '../components/Receipt'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
export function Pos() {
  const [compactView, setCompactView] = useState('tables')
  const tables = useTables(),
    products = useProducts(),
    categories = useCategories(),
    customers = useCustomers(),
    day = useDay(),
    action = useAction()
  const tableId = useUI((s) => s.tableId),
    selectTable = useUI((s) => s.selectTable),
    notify = useUI((s) => s.notify)
  const [area, setArea] = useState('Tất cả'),
    [status, setStatus] = useState('all'),
    [search, setSearch] = useState(''),
    [category, setCategory] = useState(0)
  const [modal, setModal] = useState<'move' | 'pay' | 'adjust' | 'cancel' | null>(null),
    [receipt, setReceipt] = useState<Order | null>(null),
    [lineEdit, setLineEdit] = useState<Line | null>(null)
  const table = tables.data?.find((t) => t.id === tableId),
    order = table?.order
  if (tables.isPending || products.isPending || categories.isPending) return <Loading />
  const error = tables.error || products.error || categories.error
  if (error)
    return (
      <ErrorBox
        error={error}
        retry={() => {
          tables.refetch()
          products.refetch()
          categories.refetch()
        }}
      />
    )
  const all = tables.data || [],
    occupied = all.filter((t) => t.order).length
  const visible = all.filter(
    (t) =>
      (area === 'Tất cả' || t.area === area) &&
      (status === 'all' || (status === 'busy' ? !!t.order : !t.order)),
  )
  const items = (products.data || []).filter(
    (p) => p.available && (category === 0 || p.categoryId === category) && matches(p.name, search),
  )
  const run = async (path: string, body?: unknown, method = 'POST') =>
    action.mutateAsync({ path, body, method })
  const updateLine = (l: Line, quantity: number) => {
    if (order)
      action.mutate({
        path: `/pos/orders/${order.id}/items/${l.productId}`,
        method: 'PUT',
        body: { quantity, note: l.note },
      })
  }
  return (
    <>
      <div className="pos-heading">
        <div>
          <span className="eyebrow">MỘT NGÀY THẬT NHIỀU NĂNG LƯỢNG</span>
          <h1>
            Bán hàng <span className="heading-dot">.</span>
          </h1>
        </div>
        <div className="shift-indicator">
          <span className={`status-dot ${day.data?.current.closedAt ? 'closed' : ''}`} />
          {day.data?.current.closedAt ? 'Ca đã đóng' : 'Đang phục vụ'}
          <span className="separator" />
          <Clock3 size={15} />
          <span>Ca #{day.data?.current.id || '—'}</span>
        </div>
      </div>
      <ToggleGroup
        type="single"
        value={compactView}
        onValueChange={(value) => {
          if (value) setCompactView(value)
        }}
        className="pos-view-switch"
        aria-label="Khu vực bán hàng"
      >
        <ToggleGroupItem value="tables">
          <Grid2X2 />
          Bàn
        </ToggleGroupItem>
        <ToggleGroupItem value="menu">
          <Coffee />
          Thực đơn
        </ToggleGroupItem>
        <ToggleGroupItem value="order">
          <ReceiptText />
          Đơn hàng ({order?.items.reduce((sum, line) => sum + line.quantity, 0) || 0})
        </ToggleGroupItem>
      </ToggleGroup>
      <div className="pos-layout" data-compact-view={compactView}>
        <section className="panel tables-panel">
          <div className="panel-title">
            <h2>
              <Grid2X2 size={19} />
              Sơ đồ bàn
            </h2>
            <span className="count-label">{all.length} bàn</span>
          </div>
          <ToggleGroup
            type="single"
            value={status}
            onValueChange={(value) => {
              if (value) setStatus(value)
            }}
            className="status-tabs"
            aria-label="Trạng thái bàn"
          >
            {[
              ['all', 'Tất cả', all.length],
              ['busy', 'Có khách', occupied],
              ['empty', 'Bàn trống', all.length - occupied],
            ].map(([id, label, count]) => (
              <ToggleGroupItem value={String(id)} key={id}>
                {label}
                <span>{count}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ToggleGroup
            type="single"
            value={area}
            onValueChange={(value) => {
              if (value) setArea(value)
            }}
            className="area-tabs"
            aria-label="Khu vực bàn"
          >
            {['Tất cả', 'Khu vực VIP', 'Sân vườn', 'Tầng trệt'].map((a) => (
              <ToggleGroupItem key={a} value={a}>
                {a === 'Khu vực VIP' ? 'VIP' : a}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ScrollArea className="tables-scroll">
            {['Khu vực VIP', 'Sân vườn', 'Tầng trệt']
              .filter((a) => area === 'Tất cả' || a === area)
              .map((a) => {
                const list = visible.filter((t) => t.area === a)
                const Icon = a === 'Khu vực VIP' ? Armchair : a === 'Sân vườn' ? Flower2 : Sun
                return (
                  list.length > 0 && (
                    <div className="table-area" key={a}>
                      <div className="area-label">
                        <span>
                          <Icon size={15} />
                          {a}
                        </span>
                        <small>{list.length} bàn</small>
                      </div>
                      <div className="table-grid">
                        {list.map((t) => (
                          <Button
                            variant="ghost"
                            key={t.id}
                            className={`table-card ${t.order ? 'occupied' : ''} ${t.id === tableId ? 'chosen' : ''}`}
                            onClick={() => {
                              selectTable(t.id)
                              setCompactView('menu')
                            }}
                            aria-label={`${t.name} ${t.order ? 'Có khách' : 'Trống'}`}
                            aria-pressed={t.id === tableId}
                          >
                            {t.id === tableId && (
                              <span className="table-check">
                                <Check size={11} />
                              </span>
                            )}
                            <Armchair size={27} strokeWidth={1.3} />
                            <strong>{t.name}</strong>
                            <span>{t.order ? money(t.order.total) : 'Trống'}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )
                )
              })}
            {!visible.length && (
              <Empty
                title="Không có bàn phù hợp"
                text="Thử thay đổi bộ lọc trạng thái hoặc khu vực."
              />
            )}
          </ScrollArea>
          <div className="table-legend">
            <span>
              <i className="legend-dot free" />
              Bàn trống
            </span>
            <span>
              <i className="legend-dot busy" />
              Có khách
            </span>
            <span>
              <i className="legend-dot selected" />
              Đang chọn
            </span>
          </div>
        </section>
        <section className="panel menu-panel">
          <div className="panel-title">
            <h2>
              <Coffee size={20} />
              Thực đơn
            </h2>
            <span className="count-label">{items.length} món</span>
          </div>
          <div className="menu-filters">
            <SearchBox value={search} onChange={setSearch} placeholder="Tìm món bạn cần..." />
            <ToggleGroup
              type="single"
              variant="outline"
              value={String(category)}
              onValueChange={(value) => {
                if (value) setCategory(Number(value))
              }}
              className="category-strip"
              aria-label="Danh mục món"
            >
              <ToggleGroupItem value="0">Tất cả</ToggleGroupItem>
              {categories.data?.map((c) => (
                <ToggleGroupItem value={String(c.id)} key={c.id}>
                  {c.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <ScrollArea className="products-scroll">
            <div className="product-list">
              {items.map((p) => (
                <Button
                  variant="ghost"
                  className="product-item"
                  key={p.id}
                  disabled={action.isPending || !!day.data?.current.closedAt}
                  onClick={() => {
                    if (!table) {
                      notify('Hãy chọn bàn trước khi thêm món', true)
                      return
                    }
                    action.mutate({
                      path: `/pos/tables/${table.id}/items`,
                      body: { productId: p.id },
                    })
                  }}
                >
                  <span className={`product-art art-${p.icon}`}>
                    {['leaf', 'citrus', 'blend'].includes(p.icon) ? (
                      <Leaf size={27} strokeWidth={1.4} />
                    ) : (
                      <Coffee size={27} strokeWidth={1.4} />
                    )}
                  </span>
                  <div>
                    <h3>{p.name}</h3>
                    <span>{money(p.price)}</span>
                  </div>
                  <span className="add-product">
                    <Plus size={18} />
                  </span>
                </Button>
              ))}
            </div>
            {!items.length && (
              <Empty
                title="Không tìm thấy món"
                text="Thử tên món khác hoặc chọn tất cả danh mục."
              />
            )}
          </ScrollArea>
          <div className="menu-hint">
            <Plus size={14} />
            <span>Chọn món để thêm vào đơn của bàn</span>
          </div>
        </section>
        <section className="panel order-panel">
          <div className="order-header">
            <div>
              <span className="eyebrow">CHI TIẾT ĐƠN HÀNG</span>
              <h2>
                {table?.name || 'Chọn một bàn'}
                <Badge variant="secondary">{order ? 'Đang phục vụ' : 'Bàn trống'}</Badge>
              </h2>
            </div>
            <ReceiptText size={25} strokeWidth={1.3} />
          </div>
          <div className="order-meta">
            <span>
              <Users size={14} />
              {table?.seats || '—'} chỗ ngồi
            </span>
            <span>
              {order ? `#CF${String(order.id).padStart(6, '0')}` : 'Đơn mới'}
              {order &&
                ` · ${new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </div>
          <Button
            variant="ghost"
            className="customer-picker"
            disabled={!order || action.isPending}
            onClick={() => setModal('adjust')}
          >
            <span className="customer-icon">
              <Users size={18} />
            </span>
            <div>
              <b>{order?.customerName || 'Khách lẻ'}</b>
              <small>
                {order?.customerId ? 'Khách hàng thành viên' : 'Thêm khách hàng cho đơn'}
              </small>
            </div>
            <ChevronRight size={17} />
          </Button>
          <ScrollArea className="order-items" type="always" aria-label="Danh sách món đã chọn">
            <div className="order-columns">
              <span>Món đã chọn</span>
              <span>Số lượng</span>
              <span>Đơn giá</span>
              <span>Thành tiền</span>
              <span aria-hidden="true" />
            </div>
            {order?.items.length ? (
              order.items.map((l, i) => (
                <div className="order-line" key={l.productId}>
                  <div className="line-title">
                    <span className="line-number">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3>{l.name}</h3>
                      <Button
                        variant="ghost"
                        className="line-note"
                        title={l.note || 'Thêm ghi chú'}
                        onClick={() => setLineEdit(l)}
                      >
                        <NotebookPen size={11} />
                        <span>{l.note || 'Thêm ghi chú'}</span>
                      </Button>
                    </div>
                  </div>
                  <div className="quantity">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={action.isPending}
                      aria-label={`Giảm ${l.name}`}
                      onClick={() => updateLine(l, l.quantity - 1)}
                    >
                      <Minus size={17} />
                    </Button>
                    <b>{l.quantity}</b>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={action.isPending || l.quantity >= 999}
                      aria-label={`Tăng ${l.name}`}
                      onClick={() => updateLine(l, l.quantity + 1)}
                    >
                      <Plus size={17} />
                    </Button>
                  </div>
                  <span className="line-price">{money(l.price)}</span>
                  <strong className="line-total">{money(l.price * l.quantity)}</strong>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="remove-line"
                    aria-label={`Xóa ${l.name}`}
                    disabled={action.isPending}
                    onClick={() => updateLine(l, 0)}
                  >
                    <Trash2 size={17} />
                  </Button>
                </div>
              ))
            ) : (
              <Empty
                title="Một chiếc bàn, nhiều câu chuyện"
                text="Chọn món từ thực đơn để bắt đầu phục vụ."
              />
            )}
          </ScrollArea>
          <div className="order-summary">
            <div className="summary-row">
              <span>
                Tạm tính{' '}
                <small>({order?.items.reduce((n, l) => n + l.quantity, 0) || 0} món)</small>
              </span>
              <b>{money(order?.subtotal || 0)}</b>
            </div>
            <div className="order-adjustments">
              <Button
                variant="ghost"
                className="summary-row summary-edit"
                disabled={!order}
                onClick={() => setModal('adjust')}
              >
                <span>
                  Giảm giá <Plus size={12} />
                </span>
                <b className="text-teal">−{money(order?.discount || 0)}</b>
              </Button>
              <Button
                variant="ghost"
                className="summary-row summary-edit"
                disabled={!order}
                onClick={() => setModal('adjust')}
              >
                <span>
                  Phụ thu <Plus size={12} />
                </span>
                <b>{money(order?.surcharge || 0)}</b>
              </Button>
            </div>
            {order?.note && <p className="order-note">{order.note}</p>}
            <div className="summary-total">
              <span>Khách cần trả</span>
              <strong>{money(order?.total || 0)}</strong>
            </div>
            <div className="order-actions">
              <div className="order-tools">
                <Button
                  variant="outline"
                  disabled={!order || action.isPending}
                  onClick={() => setModal('move')}
                >
                  <ArrowRightLeft size={15} />
                  Chuyển / Gộp bàn
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={!order || action.isPending}
                  onClick={() => setModal('cancel')}
                >
                  <Trash2 size={15} />
                  Hủy đơn
                </Button>
              </div>
              <Button
                className="checkout-button"
                disabled={!order?.items.length || action.isPending}
                onClick={() => setModal('pay')}
              >
                <Banknote size={21} />
                <span>Thanh toán</span>
                <ChevronRight size={19} />
              </Button>
            </div>
          </div>
        </section>
      </div>
      {modal === 'move' && order && (
        <MoveModal
          tables={all}
          order={order}
          pending={action.isPending}
          onClose={() => setModal(null)}
          onMove={async (id) => {
            const moved = (await run(`/pos/orders/${order.id}/move`, {
              targetTableId: id,
            })) as Order
            selectTable(moved.tableId)
            setModal(null)
            notify('Đã chuyển / gộp bàn thành công')
          }}
        />
      )}
      {modal === 'pay' && order && (
        <PaymentModal
          order={order}
          pending={action.isPending}
          onClose={() => setModal(null)}
          onPay={async (method, tendered) => {
            const paid = (await run(`/pos/orders/${order.id}/checkout`, {
              method,
              tendered,
              version: order.version,
            })) as Order
            setModal(null)
            setReceipt(paid)
            notify('Thanh toán thành công')
          }}
        />
      )}
      {modal === 'adjust' && order && (
        <Modal title="Thông tin đơn hàng" onClose={() => setModal(null)}>
          <form
            className="modal-form"
            onSubmit={async (e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              try {
                await run(
                  `/pos/orders/${order.id}`,
                  {
                    customerId: f.get('customerId') ? Number(f.get('customerId')) : null,
                    discount: Number(f.get('discount')),
                    surcharge: Number(f.get('surcharge')),
                    note: f.get('note'),
                  },
                  'PUT',
                )
                setModal(null)
              } catch {
                /* shown by mutation */
              }
            }}
          >
            <Field label="Khách hàng">
              <NativeSelect name="customerId" defaultValue={order.customerId || ''}>
                <NativeSelectOption value="">Khách lẻ</NativeSelectOption>
                {customers.data?.map((c) => (
                  <NativeSelectOption key={c.id} value={c.id}>
                    {c.name} · {c.phone}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <div className="form-grid">
              <Field label="Giảm giá (đ)">
                <Input
                  name="discount"
                  type="number"
                  min="0"
                  max={order.subtotal}
                  step="1"
                  defaultValue={order.discount}
                  required
                />
              </Field>
              <Field label="Phụ thu (đ)">
                <Input
                  name="surcharge"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={order.surcharge}
                  required
                />
              </Field>
            </div>
            <Field label="Ghi chú đơn hàng">
              <Textarea
                name="note"
                maxLength={250}
                defaultValue={order.note}
                placeholder="Yêu cầu đặc biệt của khách..."
              />
            </Field>
            <Button variant="default" disabled={action.isPending}>
              Lưu thông tin
            </Button>
          </form>
        </Modal>
      )}
      {modal === 'cancel' && order && (
        <Modal title="Hủy đơn hàng" onClose={() => setModal(null)}>
          <form
            className="modal-form"
            onSubmit={async (e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              try {
                await run(`/pos/orders/${order.id}/cancel`, { reason: f.get('reason') })
                setModal(null)
                notify('Đã hủy đơn hàng')
              } catch {
                /* shown by mutation */
              }
            }}
          >
            <p>
              Hủy đơn {table?.name}, tổng {money(order.total)}. Bàn sẽ trở về trạng thái trống.
            </p>
            <Field label="Lý do hủy">
              <Textarea
                name="reason"
                required
                maxLength={250}
                placeholder="Nhập lý do hủy đơn..."
              />
            </Field>
            <Button variant="destructive" disabled={action.isPending}>
              Xác nhận hủy đơn
            </Button>
          </form>
        </Modal>
      )}
      {lineEdit && order && (
        <Modal title={`Ghi chú · ${lineEdit.name}`} onClose={() => setLineEdit(null)}>
          <form
            className="modal-form"
            onSubmit={async (e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              try {
                await run(
                  `/pos/orders/${order.id}/items/${lineEdit.productId}`,
                  { quantity: lineEdit.quantity, note: f.get('note') },
                  'PUT',
                )
                setLineEdit(null)
              } catch {
                /* shown by mutation */
              }
            }}
          >
            <Field label="Yêu cầu của khách">
              <Textarea
                name="note"
                maxLength={250}
                defaultValue={lineEdit.note}
                placeholder="Ít đường, ít đá..."
              />
            </Field>
            <Button variant="default" disabled={action.isPending}>
              Lưu ghi chú
            </Button>
          </form>
        </Modal>
      )}
      {receipt && <Receipt order={receipt} onClose={() => setReceipt(null)} />}
    </>
  )
}
function MoveModal({
  tables,
  order,
  pending,
  onClose,
  onMove,
}: {
  tables: Table[]
  order: Order
  pending: boolean
  onClose: () => void
  onMove: (id: number) => Promise<void>
}) {
  const [id, setId] = useState<number | null>(null),
    [search, setSearch] = useState('')
  const target = tables.find((t) => t.id === id)
  return (
    <Modal title="Chuyển / Gộp bàn" onClose={onClose}>
      <div className="modal-form">
        <p>
          Từ <b>{order.tableName}</b> · {money(order.total)}. Chọn bàn trống để chuyển, bàn có khách
          để gộp.
        </p>
        <SearchBox value={search} onChange={setSearch} placeholder="Tìm bàn đích..." />
        <div className="move-grid">
          {tables
            .filter((t) => t.id !== order.tableId && matches(t.name, search))
            .map((t) => (
              <Button
                variant="ghost"
                key={t.id}
                className={`move-table ${t.order ? 'busy' : ''} ${id === t.id ? 'selected' : ''}`}
                onClick={() => setId(t.id)}
              >
                <Armchair size={20} />
                <b>{t.name}</b>
                <small>{t.order ? money(t.order.total) : 'Bàn trống'}</small>
              </Button>
            ))}
        </div>
        {target && (
          <p className="info-box">
            {target.order
              ? `Gộp vào ${target.name} · Tổng mới ${money(order.total + target.order.total)}`
              : `Chuyển toàn bộ đơn sang ${target.name}`}
          </p>
        )}
        <Button
          variant="default"
          disabled={!id || pending}

          onClick={() => {
            if (id) onMove(id).catch(() => {})
          }}
        >
          <ArrowRightLeft size={17} />
          {target?.order ? 'Xác nhận gộp bàn' : 'Xác nhận chuyển bàn'}
        </Button>
      </div>
    </Modal>
  )
}
function PaymentModal({
  order,
  pending,
  onClose,
  onPay,
}: {
  order: Order
  pending: boolean
  onClose: () => void
  onPay: (method: string, tendered: number) => Promise<void>
}) {
  const [method, setMethod] = useState('CASH'),
    [tendered, setTendered] = useState(order.total)
  function submit(e: FormEvent) {
    e.preventDefault()
    onPay(method, tendered).catch(() => {})
  }
  return (
    <Modal title="Thanh toán đơn hàng" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <div className="pay-total">
          <span>
            {order.tableName} · {dateTime(order.createdAt)}
          </span>
          <h2>{money(order.total)}</h2>
          <small>Tổng tiền khách cần thanh toán</small>
        </div>
        <div className="space-y-3">
          <span className="text-sm font-medium" id="payment-method-label">
            Phương thức thanh toán
          </span>
          <RadioGroup
            value={method}
            onValueChange={setMethod}
            aria-labelledby="payment-method-label"
            className="flex flex-wrap gap-4"
          >
            {Object.entries(paymentNames).map(([key, name]) => (
              <Label key={key} className="flex items-center gap-2">
                <RadioGroupItem value={key} />
                {name}
              </Label>
            ))}
          </RadioGroup>
        </div>
        {method === 'CASH' ? (
          <>
            <Field label="Tiền khách đưa (đ)">
              <Input
                type="number"
                min={order.total}
                step="1"
                required
                value={tendered}
                onChange={(e) => setTendered(Number(e.target.value))}
              />
            </Field>
            <div className="cash-presets">
              {[order.total, ...[50000, 100000, 200000, 500000].filter((n) => n > order.total)].map(
                (n) => (
                  <Button variant="ghost" type="button" key={n} onClick={() => setTendered(n)}>
                    {money(n)}
                  </Button>
                ),
              )}
            </div>
            <div className="summary-row">
              <span>Tiền trả lại khách</span>
              <strong className="text-teal">{money(Math.max(0, tendered - order.total))}</strong>
            </div>
          </>
        ) : (
          <Alert className="info-box">
            Xác nhận đã nhận đủ {money(order.total)} qua {paymentNames[method].toLowerCase()} trước
            khi hoàn tất.
          </Alert>
        )}
        <Button
          variant="default"

          disabled={pending || (method === 'CASH' && tendered < order.total)}
        >
          <Check size={18} />
          {pending ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
        </Button>
      </form>
    </Modal>
  )
}

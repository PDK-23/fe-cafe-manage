import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Banknote,
  ReceiptText,
  TrendingUp,
  ArrowUpRight,
  Download,
  CalendarDays,
  LockKeyhole,
  UnlockKeyhole,
  CheckCircle2,
  Eye,
} from 'lucide-react'
import { api, money, dateTime, localDate, matches, paymentNames } from '../models/api'
import type { Order, Report } from '../models/types'
import { useDay, useAction } from '../viewmodels/data'
import { useUI } from '../viewmodels/session'
import { PageTitle, SearchBox, Loading, ErrorBox, Empty, Field, Modal } from '../components/ui'
import { Receipt } from '../components/Receipt'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Progress } from '@/components/ui/progress'
function DateFilter({
  from,
  to,
  setFrom,
  setTo,
}: {
  from: string
  to: string
  setFrom: (s: string) => void
  setTo: (s: string) => void
}) {
  return (
    <div className="date-filter">
      <CalendarDays size={17} />
      <Input
        aria-label="Từ ngày"
        type="date"
        value={from}
        max={to}
        onChange={(e) => setFrom(e.target.value)}
      />
      <span>→</span>
      <Input
        aria-label="Đến ngày"
        type="date"
        value={to}
        min={from}
        onChange={(e) => setTo(e.target.value)}
      />
    </div>
  )
}
export function Invoices() {
  const [from, setFrom] = useState(localDate()),
    [to, setTo] = useState(localDate()),
    [search, setSearch] = useState(''),
    [method, setMethod] = useState(''),
    [receipt, setReceipt] = useState<Order | null>(null)
  const query = useQuery({
    queryKey: ['invoices', from, to],
    queryFn: () => api<Order[]>(`/pos/invoices?from=${from}&to=${to}`),
    enabled: !!from && !!to,
  })
  const rows = (query.data || []).filter(
    (o) =>
      (!method || o.paymentMethod === method) &&
      matches(
        `${o.id} CF${String(o.id).padStart(6, '0')} ${o.tableName} ${o.customerName || 'Khách lẻ'}`,
        search,
      ),
  )
  return (
    <>
      <PageTitle title="Hóa đơn" description="Lưu lại từng giao dịch, tra cứu nhanh khi bạn cần.">
        <DateFilter {...{ from, to, setFrom, setTo }} />
      </PageTitle>
      <div className="metrics-grid three">
        <Metric
          icon={<ReceiptText />}
          label="Hóa đơn trong kỳ"
          value={String(rows.length)}
          suffix="hóa đơn"
        />
        <Metric
          icon={<Banknote />}
          label="Tổng thanh toán"
          value={money(rows.reduce((n, o) => n + o.total, 0))}
        />
        <Metric icon={<CheckCircle2 />} label="Trạng thái" value="Đã thanh toán" />
      </div>
      <section className="panel">
        <div className="list-toolbar">
          <h2>Lịch sử hóa đơn</h2>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Tìm mã hóa đơn, bàn, khách..."
          />
          <NativeSelect
            aria-label="Phương thức thanh toán"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <NativeSelectOption value="">Tất cả phương thức</NativeSelectOption>
            {Object.entries(paymentNames).map(([k, v]) => (
              <NativeSelectOption key={k} value={k}>
                {v}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.error ? (
          <ErrorBox error={query.error} />
        ) : rows.length ? (
          <div className="data-table-wrap">
            <Table className="data-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Mã hóa đơn</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Bàn / Khách hàng</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <b className="text-teal">CF{String(o.id).padStart(6, '0')}</b>
                    </TableCell>
                    <TableCell>{dateTime(o.paidAt!)}</TableCell>
                    <TableCell>
                      <b>{o.tableName}</b>
                      <small className="block-muted">{o.customerName || 'Khách lẻ'}</small>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="badge gray">
                        {paymentNames[o.paymentMethod]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <b>{money(o.total)}</b>
                    </TableCell>
                    <TableCell>
                      <Button variant="secondary" onClick={() => setReceipt(o)}>
                        <Eye size={16} />
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Empty
            title="Chưa có hóa đơn"
            text="Hãy chọn khoảng ngày khác hoặc hoàn tất thanh toán một đơn."
          />
        )}
      </section>
      {receipt && <Receipt order={receipt} onClose={() => setReceipt(null)} />}
    </>
  )
}
function Metric({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode
  label: string
  value: string
  suffix?: string
}) {
  return (
    <Card className="metric-card">
      <span className="metric-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <h2>
          {value}
          {suffix && <span>{suffix}</span>}
        </h2>
      </div>
    </Card>
  )
}
export function Reports() {
  const [from, setFrom] = useState(localDate().slice(0, 8) + '01'),
    [to, setTo] = useState(localDate())
  const query = useQuery({
    queryKey: ['reports', from, to],
    queryFn: () => api<Report>(`/pos/reports?from=${from}&to=${to}`),
    enabled: !!from && !!to,
  })
  const report = query.data
  const exportCsv = () => {
    if (!report) return
    const safe = (s: string) => `"${s.replace(/"/g, '""').replace(/^[=+@-]/, "'$&")}"`
    const csv =
      '\uFEFFNgày,Doanh thu\r\n' +
      Object.entries(report.daily)
        .map(([d, n]) => `${safe(d)},${n}`)
        .join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `doanh-thu-${from}-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <>
      <PageTitle
        title="Báo cáo doanh thu"
        description="Những con số nhỏ, giúp bạn đưa ra quyết định lớn."
      >
        <DateFilter {...{ from, to, setFrom, setTo }} />
        <Button variant="outline" disabled={!report} onClick={exportCsv}>
          <Download size={17} />
          Xuất CSV
        </Button>
      </PageTitle>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <ErrorBox error={query.error} />
      ) : (
        report && (
          <>
            <div className="metrics-grid three">
              <Metric
                icon={<Banknote />}
                label="Doanh thu thực nhận"
                value={money(report.revenue)}
              />
              <Metric
                icon={<ReceiptText />}
                label="Số hóa đơn"
                value={String(report.invoiceCount)}
                suffix="hóa đơn"
              />
              <Metric
                icon={<TrendingUp />}
                label="Giá trị trung bình / đơn"
                value={money(report.average)}
              />
            </div>
            <div className="report-grid">
              <section className="panel chart-panel">
                <div className="panel-title">
                  <h2>Doanh thu theo ngày</h2>
                  <Badge variant="secondary" className="badge green">
                    VND
                  </Badge>
                </div>
                {Object.keys(report.daily).length ? (
                  <ChartContainer
                    className="h-72 w-full p-4"
                    config={{ revenue: { label: 'Doanh thu', color: 'var(--primary)' } }}
                  >
                    <BarChart
                      accessibilityLayer
                      data={Object.entries(report.daily).map(([date, revenue]) => ({
                        date,
                        revenue,
                      }))}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => date.slice(5).split('-').reverse().join('/')}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        width={64}
                        tickFormatter={(value) =>
                          new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)
                        }
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent formatter={(value) => money(Number(value))} />
                        }
                      />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <Empty
                    title="Chưa có doanh thu"
                    text="Biểu đồ sẽ cập nhật khi có hóa đơn thanh toán."
                  />
                )}
              </section>
              <section className="panel payment-panel">
                <div className="panel-title">
                  <h2>Phương thức thanh toán</h2>
                </div>
                <div className="payment-breakdown">
                  {Object.entries(paymentNames).map(([k, v]) => (
                    <div key={k}>
                      <div className="summary-row">
                        <span>{v}</span>
                        <b>{money(report.payments[k] || 0)}</b>
                      </div>
                      <Progress
                        aria-label={v}
                        value={
                          report.revenue ? ((report.payments[k] || 0) / report.revenue) * 100 : 0
                        }
                      />
                      <small>
                        {report.revenue
                          ? Math.round(((report.payments[k] || 0) / report.revenue) * 100)
                          : 0}
                        % tổng doanh thu
                      </small>
                    </div>
                  ))}
                </div>
              </section>
              <section className="panel">
                <div className="panel-title">
                  <h2>Món bán chạy</h2>
                  <ArrowUpRight size={19} />
                </div>
                <p className="section-caption">Doanh số món trước giảm giá và phụ thu.</p>
                {report.products.length ? (
                  <Table className="data-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên món</TableHead>
                        <TableHead>Số lượng</TableHead>
                        <TableHead>Doanh số</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.products.slice(0, 10).map((p, i) => (
                        <TableRow key={p.name}>
                          <TableCell>
                            <span className="rank-number">{i + 1}</span>
                            <b>{p.name}</b>
                          </TableCell>
                          <TableCell>{p.quantity}</TableCell>
                          <TableCell>{money(p.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Empty />
                )}
              </section>
              <section className="panel">
                <div className="panel-title">
                  <h2>Khách hàng nổi bật</h2>
                </div>
                {report.customers.length ? (
                  <Table className="data-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Số đơn</TableHead>
                        <TableHead>Chi tiêu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.customers.slice(0, 10).map((p) => (
                        <TableRow key={p.name}>
                          <TableCell>
                            <b>{p.name}</b>
                          </TableCell>
                          <TableCell>{p.quantity}</TableCell>
                          <TableCell>{money(p.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Empty />
                )}
              </section>
            </div>
          </>
        )
      )}
    </>
  )
}
export function Settlement() {
  const query = useDay(),
    action = useAction(),
    notify = useUI((s) => s.notify)
  const [counted, setCounted] = useState(''),
    [note, setNote] = useState(''),
    [confirm, setConfirm] = useState(false),
    [opening, setOpening] = useState(0)
  if (query.isPending) return <Loading />
  if (query.error) return <ErrorBox error={query.error} />
  const day = query.data!
  const closed = !!day.current.closedAt
  return (
    <>
      <PageTitle
        title="Tất toán ngày"
        description="Đối soát rõ ràng, an tâm kết thúc một ngày làm việc."
      >
        <Badge variant="secondary" className={`badge ${closed ? 'gray' : 'green'}`}>
          <span className="status-dot" />
          {closed ? 'Đã đóng ca' : 'Đang mở ca'} #{day.current.id}
        </Badge>
      </PageTitle>
      <div className="metrics-grid three">
        <Metric icon={<Banknote />} label="Tổng doanh thu ca" value={money(day.sales)} />
        <Metric icon={<ReceiptText />} label="Thu tiền mặt" value={money(day.cashSales)} />
        <Metric
          icon={<LockKeyhole />}
          label="Bàn chưa thanh toán"
          value={String(day.openOrders)}
          suffix="bàn"
        />
      </div>
      <div className="settlement-grid">
        <section className="panel settlement-panel">
          <div className="panel-title">
            <h2>
              {closed ? <UnlockKeyhole size={20} /> : <LockKeyhole size={20} />}{' '}
              {closed ? 'Mở ngày kinh doanh mới' : 'Đối soát tiền mặt'}
            </h2>
          </div>
          {closed ? (
            <form
              className="modal-form"
              onSubmit={(e) => {
                e.preventDefault()
                action.mutate(
                  { path: '/pos/day/open', body: { openingCash: opening } },
                  {
                    onSuccess: () => {
                      notify('Đã mở ca mới')
                      setCounted('')
                      setNote('')
                    },
                  },
                )
              }}
            >
              <Alert className="success-box">
                <CheckCircle2 />
                <h3>Ca đã được tất toán</h3>
                <p>
                  {dateTime(day.current.closedAt!)} · {day.current.closedBy}
                </p>
                <b>
                  Chênh lệch:{' '}
                  {money((day.current.countedCash || 0) - (day.current.expectedCash || 0))}
                </b>
              </Alert>
              <Field label="Tiền mặt đầu ca mới (đ)">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={opening}
                  required
                  onChange={(e) => setOpening(Number(e.target.value))}
                />
              </Field>
              <Button variant="default" disabled={action.isPending}>
                <UnlockKeyhole size={17} />
                Mở ca mới
              </Button>
            </form>
          ) : (
            <form
              className="modal-form"
              onSubmit={(e) => {
                e.preventDefault()
                setConfirm(true)
              }}
            >
              <div className="summary-row">
                <span>Bắt đầu ca</span>
                <b>{dateTime(day.current.openedAt)}</b>
              </div>
              <div className="summary-row">
                <span>Tiền mặt đầu ca</span>
                <b>{money(day.current.openingCash)}</b>
              </div>
              <div className="summary-row">
                <span>Tiền mặt bán hàng</span>
                <b>{money(day.cashSales)}</b>
              </div>
              <div className="summary-total">
                <span>Tiền mặt cần có</span>
                <strong>{money(day.expectedCash)}</strong>
              </div>
              <Field label="Tiền mặt thực đếm (đ)">
                <Input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={counted}
                  onChange={(e) => setCounted(e.target.value)}
                  placeholder="Nhập số tiền thực tế trong quầy"
                />
              </Field>
              {counted !== '' && (
                <Alert
                  className={`info-box ${Number(counted) !== day.expectedCash ? 'warning' : ''}`}
                >
                  Chênh lệch: <b>{money(Number(counted) - day.expectedCash)}</b>
                  {Number(counted) === day.expectedCash
                    ? ' · Khớp số liệu'
                    : ' · Vui lòng kiểm tra và ghi chú'}
                </Alert>
              )}
              <Field label="Ghi chú đối soát">
                <Textarea
                  value={note}
                  maxLength={250}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Giải thích chênh lệch hoặc bàn giao ca..."
                />
              </Field>
              {day.openOrders > 0 && (
                <Alert className="info-box warning">
                  Còn {day.openOrders} bàn chưa thanh toán. Thanh toán hoặc hủy đơn để tất toán.
                </Alert>
              )}
              <Button variant="default" disabled={action.isPending || day.openOrders > 0}>
                <LockKeyhole size={17} />
                Xác nhận tất toán
              </Button>
            </form>
          )}
        </section>
        <section className="panel">
          <div className="panel-title">
            <h2>Lịch sử ca làm việc</h2>
          </div>
          <div className="day-history">
            {day.history.map((d) => (
              <div className="history-item" key={d.id}>
                <div className={`history-icon ${d.closedAt ? '' : 'active'}`}>
                  {d.closedAt ? <CheckCircle2 size={20} /> : <UnlockKeyhole size={20} />}
                </div>
                <div>
                  <b>Ca #{d.id}</b>
                  <p>{dateTime(d.openedAt)}</p>
                  <small>{d.closedAt ? `Đóng: ${dateTime(d.closedAt)}` : 'Đang phục vụ'}</small>
                  {d.note && <p>{d.note}</p>}
                </div>
                <Badge variant="secondary" className={`badge ${d.closedAt ? 'gray' : 'green'}`}>
                  {d.closedAt ? 'Đã đóng' : 'Đang mở'}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
      {confirm && (
        <Modal title="Xác nhận đóng ca" onClose={() => setConfirm(false)}>
          <div className="modal-form">
            <p>
              Đóng ca #{day.current.id} với tiền mặt thực đếm <b>{money(Number(counted))}</b> và
              chênh lệch <b>{money(Number(counted) - day.expectedCash)}</b>.
            </p>
            <p>Sau khi đóng, cần mở ca mới để tiếp tục bán hàng.</p>
            <Button
              variant="default"

              disabled={action.isPending}
              onClick={() =>
                action.mutate(
                  { path: '/pos/day/close', body: { countedCash: Number(counted), note } },
                  {
                    onSuccess: () => {
                      setConfirm(false)
                      notify('Tất toán thành công')
                    },
                  },
                )
              }
            >
              Đóng ca
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

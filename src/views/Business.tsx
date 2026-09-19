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
      <input
        aria-label="Từ ngày"
        type="date"
        value={from}
        max={to}
        onChange={(e) => setFrom(e.target.value)}
      />
      <span>→</span>
      <input
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
          <select
            aria-label="Phương thức thanh toán"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="">Tất cả phương thức</option>
            {Object.entries(paymentNames).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.error ? (
          <ErrorBox error={query.error} />
        ) : rows.length ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã hóa đơn</th>
                  <th>Thời gian</th>
                  <th>Bàn / Khách hàng</th>
                  <th>Thanh toán</th>
                  <th>Tổng tiền</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <b className="text-teal">CF{String(o.id).padStart(6, '0')}</b>
                    </td>
                    <td>{dateTime(o.paidAt!)}</td>
                    <td>
                      <b>{o.tableName}</b>
                      <small className="block-muted">{o.customerName || 'Khách lẻ'}</small>
                    </td>
                    <td>
                      <span className="badge gray">{paymentNames[o.paymentMethod]}</span>
                    </td>
                    <td>
                      <b>{money(o.total)}</b>
                    </td>
                    <td>
                      <button className="button subtle" onClick={() => setReceipt(o)}>
                        <Eye size={16} />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    <div className="metric-card">
      <span className="metric-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <h2>
          {value}
          {suffix && <span>{suffix}</span>}
        </h2>
      </div>
    </div>
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
        <button className="button secondary" disabled={!report} onClick={exportCsv}>
          <Download size={17} />
          Xuất CSV
        </button>
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
                  <span className="badge green">VND</span>
                </div>
                {Object.keys(report.daily).length ? (
                  <div className="bar-chart">
                    {Object.entries(report.daily).map(([date, value]) => (
                      <div className="bar-column" key={date}>
                        <span>{money(value)}</span>
                        <div className="bar-track">
                          <div
                            className="bar"
                            style={{
                              height: `${Math.max(2, (value / Math.max(1, ...Object.values(report.daily))) * 100)}%`,
                            }}
                          />
                        </div>
                        <small>{date.slice(5).split('-').reverse().join('/')}</small>
                      </div>
                    ))}
                  </div>
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
                      <div className="progress-track">
                        <div
                          style={{
                            width: `${report.revenue ? ((report.payments[k] || 0) / report.revenue) * 100 : 0}%`,
                          }}
                        />
                      </div>
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
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tên món</th>
                        <th>Số lượng</th>
                        <th>Doanh số</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.products.slice(0, 10).map((p, i) => (
                        <tr key={p.name}>
                          <td>
                            <span className="rank-number">{i + 1}</span>
                            <b>{p.name}</b>
                          </td>
                          <td>{p.quantity}</td>
                          <td>{money(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <Empty />
                )}
              </section>
              <section className="panel">
                <div className="panel-title">
                  <h2>Khách hàng nổi bật</h2>
                </div>
                {report.customers.length ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Khách hàng</th>
                        <th>Số đơn</th>
                        <th>Chi tiêu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.customers.slice(0, 10).map((p) => (
                        <tr key={p.name}>
                          <td>
                            <b>{p.name}</b>
                          </td>
                          <td>{p.quantity}</td>
                          <td>{money(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
        <span className={`badge ${closed ? 'gray' : 'green'}`}>
          <span className="status-dot" />
          {closed ? 'Đã đóng ca' : 'Đang mở ca'} #{day.current.id}
        </span>
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
              <div className="success-box">
                <CheckCircle2 />
                <h3>Ca đã được tất toán</h3>
                <p>
                  {dateTime(day.current.closedAt!)} · {day.current.closedBy}
                </p>
                <b>
                  Chênh lệch:{' '}
                  {money((day.current.countedCash || 0) - (day.current.expectedCash || 0))}
                </b>
              </div>
              <Field label="Tiền mặt đầu ca mới (đ)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={opening}
                  required
                  onChange={(e) => setOpening(Number(e.target.value))}
                />
              </Field>
              <button disabled={action.isPending} className="button primary">
                <UnlockKeyhole size={17} />
                Mở ca mới
              </button>
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
                <input
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
                <div
                  className={`info-box ${Number(counted) !== day.expectedCash ? 'warning' : ''}`}
                >
                  Chênh lệch: <b>{money(Number(counted) - day.expectedCash)}</b>
                  {Number(counted) === day.expectedCash
                    ? ' · Khớp số liệu'
                    : ' · Vui lòng kiểm tra và ghi chú'}
                </div>
              )}
              <Field label="Ghi chú đối soát">
                <textarea
                  value={note}
                  maxLength={250}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Giải thích chênh lệch hoặc bàn giao ca..."
                />
              </Field>
              {day.openOrders > 0 && (
                <div className="info-box warning">
                  Còn {day.openOrders} bàn chưa thanh toán. Thanh toán hoặc hủy đơn để tất toán.
                </div>
              )}
              <button className="button primary" disabled={action.isPending || day.openOrders > 0}>
                <LockKeyhole size={17} />
                Xác nhận tất toán
              </button>
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
                <span className={`badge ${d.closedAt ? 'gray' : 'green'}`}>
                  {d.closedAt ? 'Đã đóng' : 'Đang mở'}
                </span>
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
            <button
              className="button primary"
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
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

import { useEffect, useRef, type ReactNode } from 'react'
import { X, Search, LoaderCircle, AlertCircle, Check, Inbox } from 'lucide-react'
import { useUI } from '../viewmodels/session'
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
    const dialog = ref.current
    return () => dialog?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'wide' : ''}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <header>
        <div>
          <span className="eyebrow">CAFE FLOW</span>
          <h2>{title}</h2>
        </div>
        <button className="icon-button" aria-label="Đóng" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  )
}
export function SearchBox({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
}: {
  value: string
  onChange: (s: string) => void
  placeholder?: string
}) {
  return (
    <div className="search">
      <Search size={17} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button aria-label="Xóa tìm kiếm" onClick={() => onChange('')}>
          <X size={14} />
        </button>
      )}
    </div>
  )
}
export function Empty({
  title = 'Chưa có dữ liệu',
  text = 'Dữ liệu sẽ hiển thị tại đây khi có phát sinh.',
}: {
  title?: string
  text?: string
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Inbox size={29} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}
export function Loading() {
  return (
    <div className="empty">
      <LoaderCircle className="spin" />
      <p>Đang tải dữ liệu...</p>
    </div>
  )
}
export function ErrorBox({ error, retry }: { error: Error | null; retry?: () => void }) {
  return (
    <div role="alert" className="error-box">
      <AlertCircle size={22} />
      <p>{error?.message || 'Không tải được dữ liệu'}</p>
      {retry && (
        <button className="button secondary" onClick={retry}>
          Thử lại
        </button>
      )}
    </div>
  )
}
export function Toast() {
  const notice = useUI((s) => s.notice)
  const dismiss = useUI((s) => s.dismiss)
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(dismiss, 5000)
      return () => clearTimeout(timer)
    }
  }, [notice, dismiss])
  return (
    notice && (
      <div
        className={`toast ${notice.error ? 'toast-error' : ''}`}
        role={notice.error ? 'alert' : 'status'}
      >
        {notice.error ? <AlertCircle size={20} /> : <Check size={20} />}
        <span>{notice.text}</span>
        <button aria-label="Đóng thông báo" onClick={dismiss}>
          <X size={16} />
        </button>
      </div>
    )
  )
}
export function PageTitle({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className="page-title">
      <div>
        <span className="eyebrow">QUẢN LÝ QUÁN CÀ PHÊ</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  )
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

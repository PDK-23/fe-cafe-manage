import type { ReactNode } from 'react'
import { X, Search, AlertCircle, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Alert, AlertDescription } from './ui/alert'
import {
  Empty as EmptyState,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from './ui/empty'
import { Spinner } from './ui/spinner'

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
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className={cn('app-dialog max-h-[90dvh] overflow-y-auto', wide && 'sm:max-w-3xl')}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export function SearchBox({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="search relative min-w-0">
      <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
      <Input
        className="pr-10 pl-9"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1 right-1"
          aria-label="Xóa tìm kiếm"
          onClick={() => onChange('')}
        >
          <X />
        </Button>
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
    <EmptyState>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Inbox />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{text}</EmptyDescription>
      </EmptyHeader>
    </EmptyState>
  )
}

export function Loading() {
  return (
    <div
      className="flex min-h-40 items-center justify-center gap-3 text-muted-foreground"
      role="status"
    >
      <Spinner />
      Đang tải dữ liệu...
    </div>
  )
}

export function ErrorBox({ error, retry }: { error: Error | null; retry?: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertDescription>
        {error?.message || 'Không tải được dữ liệu'}
        {retry && (
          <Button variant="outline" onClick={retry}>
            Thử lại
          </Button>
        )}
      </AlertDescription>
    </Alert>
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
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="field flex min-w-0 flex-col items-stretch gap-2">
      <span>{label}</span>
      {children}
    </Label>
  )
}

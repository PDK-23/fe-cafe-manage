import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Save, ShieldCheck, Users, UserRoundCog, RotateCcw } from 'lucide-react'
import { api } from '../models/api'
import { useAction } from '../viewmodels/data'
import { useUI } from '../viewmodels/session'
import { ErrorBox, Loading } from '../components/ui'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type EditableRole = 'CASHIER' | 'MANAGER'
interface RoleAccess {
  role: EditableRole
  permissions: { id: string; label: string; description: string; enabled: boolean }[]
}
const roles = [
  {
    id: 'CASHIER' as const,
    label: 'Thu ngân',
    description: 'Nhân viên phục vụ và bán hàng',
    icon: Users,
  },
  {
    id: 'MANAGER' as const,
    label: 'Quản lý',
    description: 'Điều hành hoạt động của quán',
    icon: UserRoundCog,
  },
]

export function RolePermissions() {
  const [role, setRole] = useState<EditableRole>('CASHIER')
  const [drafts, setDrafts] = useState<Partial<Record<EditableRole, string[]>>>({})
  const query = useQuery({
    queryKey: ['role-permissions', role],
    queryFn: () => api<RoleAccess>(`/permissions/roles/${role}`),
  })
  const action = useAction()
  const notify = useUI((s) => s.notify)
  const hasDraft = Object.keys(drafts).length > 0
  useEffect(() => {
    if (!hasDraft) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasDraft])

  const saved = query.data?.permissions.filter((p) => p.enabled).map((p) => p.id) || []
  const selected = drafts[role] ?? saved
  const changed = selected.length !== saved.length || selected.some((id) => !saved.includes(id))
  const current = roles.find((r) => r.id === role)!
  function update(ids: string[]) {
    setDrafts((previous) => ({ ...previous, [role]: ids }))
  }
  function reset() {
    setDrafts((previous) => {
      const next = { ...previous }
      delete next[role]
      return next
    })
  }
  async function save() {
    try {
      await action.mutateAsync({
        path: `/permissions/roles/${role}`,
        method: 'PUT',
        body: { permissions: selected },
      })
      reset()
      notify(
        `Đã cập nhật quyền cho ${current.label}. Menu của nhân viên được cập nhật theo quyền mới.`,
      )
    } catch {
      /* Mutation displays the server error and keeps the draft for retry. */
    }
  }

  return (
    <div className="role-access-layout">
      <aside className="role-picker panel" aria-label="Chọn vai trò cần cấp quyền">
        <div className="panel-title">
          <h2>Vai trò nhân viên</h2>
        </div>
        <ToggleGroup
          type="single"
          value={role}
          onValueChange={(value) => {
            if (value) setRole(value as EditableRole)
          }}
          className="w-full flex-col"
          aria-label="Vai trò nhân viên"
        >
          {roles.map(({ id, label, description, icon: Icon }) => (
            <ToggleGroupItem
              value={id}
              key={id}
              className={`role-choice ${role === id ? 'selected' : ''}`}
              disabled={action.isPending}
            >
              <Icon size={24} />
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
                {drafts[id] && <small className="unsaved-label">Có thay đổi chưa lưu</small>}
              </span>
              {role === id && <Check size={20} />}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="admin-access-note">
          <ShieldCheck size={24} />
          <div>
            <strong>Quản trị viên</strong>
            <p>Luôn có toàn quyền, bao gồm quản lý nhân viên và cấp quyền.</p>
          </div>
        </div>
      </aside>
      <section className="panel role-permissions-panel" aria-label={`Quyền của ${current.label}`}>
        <div className="role-permissions-heading">
          <div>
            <span className="eyebrow">QUYỀN THEO VAI TRÒ</span>
            <h2>{current.label} được sử dụng chức năng nào?</h2>
            <p>
              Chọn quyền, sau đó bấm Lưu phân quyền để áp dụng cho tất cả nhân viên thuộc vai trò
              này.
            </p>
          </div>
          <Badge variant="secondary" className="badge green">
            {selected.length}/{query.data?.permissions.length || 6} chức năng
          </Badge>
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.error ? (
          <ErrorBox error={query.error} retry={() => query.refetch()} />
        ) : (
          <>
            <div className="permissions-select-all">
              <Label>
                <Checkbox
                  aria-label="Chọn tất cả chức năng"
                  checked={
                    selected.length === query.data.permissions.length
                      ? true
                      : selected.length
                        ? 'indeterminate'
                        : false
                  }
                  disabled={action.isPending}
                  onCheckedChange={(checked) =>
                    update(checked === true ? query.data.permissions.map((p) => p.id) : [])
                  }
                />
                <span>Chọn tất cả chức năng</span>
              </Label>
              <span>{changed ? 'Chưa lưu thay đổi' : 'Đã đồng bộ'}</span>
            </div>
            <div className="permission-options">
              {query.data.permissions.map((permission) => (
                <Label
                  key={permission.id}
                  className={`permission-option ${selected.includes(permission.id) ? 'enabled' : ''}`}
                >
                  <Checkbox
                    aria-label={permission.label}
                    checked={selected.includes(permission.id)}
                    disabled={action.isPending}
                    onCheckedChange={(checked) =>
                      update(
                        checked === true
                          ? [...selected, permission.id]
                          : selected.filter((id) => id !== permission.id),
                      )
                    }
                  />
                  <span>
                    <strong>{permission.label}</strong>
                    <small>{permission.description}</small>
                  </span>
                  <Badge
                    variant="secondary"
                    className={`badge ${selected.includes(permission.id) ? 'green' : 'gray'}`}
                  >
                    {selected.includes(permission.id) ? 'Cho phép' : 'Không cấp'}
                  </Badge>
                </Label>
              ))}
            </div>
            <div className="role-save-footer">
              <p>
                Menu và quyền thao tác được lưu cùng nhau. Cấu hình này thay thế toàn bộ quyền riêng
                của vai trò đang chọn.
              </p>
              <div>
                <Button variant="outline" disabled={!changed || action.isPending} onClick={reset}>
                  <RotateCcw size={18} />
                  Bỏ thay đổi
                </Button>
                <Button disabled={!changed || action.isPending} onClick={save}>
                  <Save size={18} />
                  {action.isPending ? 'Đang lưu...' : 'Lưu phân quyền'}
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

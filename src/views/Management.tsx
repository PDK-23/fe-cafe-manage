import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { DialogFooter } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search, Users, Coffee, ShieldCheck } from 'lucide-react'
import { api, money, matches } from '../models/api'
import { useAction, useCategories, useProducts, useCustomers, useMenus } from '../viewmodels/data'
import { useUI } from '../viewmodels/session'
import type { Product, Customer, User, Rule, Menu, Category } from '../models/types'
import { PageTitle, SearchBox, Modal, Field, Loading, ErrorBox, Empty } from '../components/ui'
import { RolePermissions } from './RolePermissions'
type Row = { id: number }
type FieldSpec = {
  name: string
  label: string
  type?: string
  required?: boolean
  options?: { value: string | number; label: string }[]
  min?: number
  max?: number
  maxLength?: number
  placeholder?: string
  pattern?: string
}
type Column<T> = { label: string; render: (row: T) => ReactNode }
function DataTable<T extends Row>({
  rows,
  columns,
  onEdit,
  onDelete,
}: {
  rows: T[]
  columns: Column<T>[]
  onEdit: (row: T) => void
  onDelete?: (row: T) => void
}) {
  return rows.length ? (
    <div className="data-table-wrap">
      <Table className="data-table">
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.label}>{c.label}</TableHead>
            ))}
            <TableHead className="align-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {columns.map((c) => (
                <TableCell key={c.label}>{c.render(row)}</TableCell>
              ))}
              <TableCell>
                <div className="row-actions">
                  <Button
                    variant="ghost"
                    size="icon-sm"

                    aria-label={`Sửa ${row.id}`}
                    onClick={() => onEdit(row)}
                  >
                    <Pencil size={16} />
                  </Button>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-danger"
                      aria-label={`Xóa ${row.id}`}
                      onClick={() => onDelete(row)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ) : (
    <Empty title="Chưa có kết quả" text="Thử từ khóa khác hoặc thêm dữ liệu mới." />
  )
}
function Editor({
  title,
  fields,
  initial,
  path,
  onClose,
  transform,
}: {
  title: string
  fields: FieldSpec[]
  initial: Record<string, unknown>
  path: string
  onClose: () => void
  transform?: (data: Record<string, unknown>) => unknown
}) {
  const action = useAction(),
    notify = useUI((s) => s.notify)
  return (
    <Modal title={title} onClose={onClose}>
      <form
        className="modal-form"
        onSubmit={async (e) => {
          e.preventDefault()
          const form = new FormData(e.currentTarget)
          const data: Record<string, unknown> = {}
          fields.forEach((f) => {
            const v = form.get(f.name)
            data[f.name] =
              f.type === 'checkbox'
                ? v === 'on'
                : f.type === 'number' || f.type === 'numeric-select'
                  ? v === ''
                    ? null
                    : Number(v)
                  : String(v || '')
          })
          try {
            await action.mutateAsync({
              path,
              method: initial.id ? 'PUT' : 'POST',
              body: transform ? transform(data) : data,
            })
            notify('Đã lưu thay đổi')
            onClose()
          } catch {
            /* toast handles error */
          }
        }}
      >
        {fields.map((f) => (
          <Field key={f.name} label={f.label}>
            {f.options ? (
              <NativeSelect
                name={f.name}
                defaultValue={String(initial[f.name] ?? '')}
                required={f.required}
              >
                {f.options.map((o) => (
                  <NativeSelectOption key={o.value} value={o.value}>
                    {o.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            ) : f.type === 'textarea' ? (
              <Textarea
                name={f.name}
                defaultValue={String(initial[f.name] ?? '')}
                placeholder={f.placeholder}
                maxLength={f.maxLength || 250}
              />
            ) : f.type === 'checkbox' ? (
              <span className="checkbox-label">
                <Checkbox name={f.name} defaultChecked={initial[f.name] !== false} />
                Đang hoạt động
              </span>
            ) : (
              <Input
                type={f.type || 'text'}
                name={f.name}
                defaultValue={String(initial[f.name] ?? '')}
                required={f.required}
                min={f.min}
                max={f.max}
                maxLength={f.maxLength || 120}
                pattern={f.pattern}
                step={f.type === 'number' ? '1' : undefined}
                placeholder={f.placeholder}
                autoComplete={f.type === 'password' ? 'new-password' : undefined}
              />
            )}
          </Field>
        ))}
        <DialogFooter className="modal-actions">
          <Button variant="outline" type="button" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button variant="default" disabled={action.isPending}>
            {action.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  )
}
function DeleteConfirm({
  path,
  name,
  onClose,
}: {
  path: string
  name: string
  onClose: () => void
}) {
  const action = useAction(),
    notify = useUI((s) => s.notify)
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
          <AlertDialogDescription>
            Xóa <b>{name}</b> khỏi danh sách? Thao tác này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={action.isPending}>Giữ lại</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"

            disabled={action.isPending}
            onClick={(event) => {
              event.preventDefault()
              action.mutate(
                { path, method: 'DELETE' },
                {
                  onSuccess: () => {
                    notify('Đã xóa dữ liệu')
                    onClose()
                  },
                },
              )
            }}
          >
            Xóa dữ liệu
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
const record = (item: object) => item as Record<string, unknown>
export function Catalog() {
  const products = useProducts(),
    categories = useCategories()
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState(0),
    [tab, setTab] = useState('products')
  const [edit, setEdit] = useState<Product | Category | false | null>(null),
    [remove, setRemove] = useState<Product | Category | null>(null)
  if (products.isPending || categories.isPending) return <Loading />
  if (products.error || categories.error)
    return <ErrorBox error={products.error || categories.error} />
  const categoryMode = tab === 'categories',
    items = (products.data || []).filter(
      (p) => matches(p.name, search) && (!category || p.categoryId === category),
    )
  const base = categoryMode ? '/catalog/categories' : '/catalog/products'
  const productFields: FieldSpec[] = [
    { name: 'name', label: 'Tên món', required: true },
    {
      name: 'categoryId',
      label: 'Danh mục',
      required: true,
      type: 'numeric-select',
      options: (categories.data || []).map((c) => ({ value: c.id, label: c.name })),
    },
    { name: 'price', label: 'Giá bán (đ)', type: 'number', required: true, min: 0, max: 100000000 },
    { name: 'available', label: 'Trạng thái bán', type: 'checkbox' },
  ]
  return (
    <>
      <PageTitle
        title="Thực đơn"
        description="Một thực đơn được chăm chút, một trải nghiệm trọn vẹn."
      >
        <Button variant="default" onClick={() => setEdit(false)}>
          <Plus size={18} />
          {categoryMode ? 'Thêm danh mục' : 'Thêm món mới'}
        </Button>
      </PageTitle>
      <div className="metrics-grid three">
        <Card className="metric-card">
          <span className="metric-icon">
            <Coffee />
          </span>
          <div>
            <small>Tổng số món</small>
            <h2>
              {products.data?.length || 0}
              <span>món</span>
            </h2>
          </div>
        </Card>
        <Card className="metric-card">
          <span className="metric-icon amber">
            <Coffee />
          </span>
          <div>
            <small>Đang phục vụ</small>
            <h2>
              {products.data?.filter((p) => p.available).length || 0}
              <span>món</span>
            </h2>
          </div>
        </Card>
        <Card className="metric-card">
          <span className="metric-icon blue">
            <Search />
          </span>
          <div>
            <small>Danh mục</small>
            <h2>
              {categories.data?.length || 0}
              <span>nhóm món</span>
            </h2>
          </div>
        </Card>
      </div>
      <Tabs
        className="panel"
        value={tab}
        onValueChange={(value) => {
          setTab(value)
          setSearch('')
        }}
      >
        <div className="list-toolbar">
          <TabsList>
            <TabsTrigger value="products">Danh sách món</TabsTrigger>
            <TabsTrigger value="categories">Danh mục</TabsTrigger>
          </TabsList>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder={categoryMode ? 'Tìm danh mục...' : 'Tìm tên món...'}
          />
          {!categoryMode && (
            <NativeSelect
              aria-label="Lọc danh mục"
              value={category}
              onChange={(e) => setCategory(Number(e.target.value))}
            >
              <NativeSelectOption value={0}>Tất cả danh mục</NativeSelectOption>
              {categories.data?.map((c) => (
                <NativeSelectOption key={c.id} value={c.id}>
                  {c.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        </div>
        <TabsContent value={tab}>
          {categoryMode ? (
            <DataTable
              rows={(categories.data || []).filter((c) => matches(c.name, search))}
              columns={[
                { label: 'Mã', render: (c) => `DM${String(c.id).padStart(3, '0')}` },
                { label: 'Tên danh mục', render: (c) => <b>{c.name}</b> },
                {
                  label: 'Số món',
                  render: (c) => products.data?.filter((p) => p.categoryId === c.id).length || 0,
                },
              ]}
              onEdit={setEdit}
              onDelete={setRemove}
            />
          ) : (
            <DataTable
              rows={items}
              columns={[
                {
                  label: 'Tên món',
                  render: (p) => (
                    <div className="name-cell">
                      <span className={`product-art small art-${p.icon}`}>
                        <Coffee size={20} />
                      </span>
                      <div>
                        <b>{p.name}</b>
                        <small>SP{String(p.id).padStart(3, '0')}</small>
                      </div>
                    </div>
                  ),
                },
                {
                  label: 'Danh mục',
                  render: (p) => categories.data?.find((c) => c.id === p.categoryId)?.name || '—',
                },
                { label: 'Giá bán', render: (p) => <b>{money(p.price)}</b> },
                {
                  label: 'Trạng thái',
                  render: (p) => (
                    <Badge
                      variant="secondary"
                      className={`badge ${p.available ? 'green' : 'gray'}`}
                    >
                      {p.available ? 'Đang bán' : 'Ngừng bán'}
                    </Badge>
                  ),
                },
              ]}
              onEdit={setEdit}
              onDelete={setRemove}
            />
          )}
        </TabsContent>
      </Tabs>
      {edit !== null && (
        <Editor
          title={`${edit ? 'Chỉnh sửa' : 'Thêm'} ${categoryMode ? 'danh mục' : 'món'}`}
          fields={
            categoryMode
              ? [{ name: 'name', label: 'Tên danh mục', required: true, maxLength: 80 }]
              : productFields
          }
          initial={
            edit
              ? record(edit)
              : { price: 25000, categoryId: categories.data?.[0]?.id, available: true }
          }
          path={`${base}${edit ? `/${edit.id}` : ''}`}
          transform={(d) =>
            categoryMode ? d : { ...d, icon: edit && 'icon' in edit ? edit.icon : 'coffee' }
          }
          onClose={() => setEdit(null)}
        />
      )}{' '}
      {remove && (
        <DeleteConfirm
          path={`${base}/${remove.id}`}
          name={remove.name}
          onClose={() => setRemove(null)}
        />
      )}
    </>
  )
}
const customerFields: FieldSpec[] = [
  { name: 'name', label: 'Họ và tên', required: true, maxLength: 100 },
  {
    name: 'phone',
    label: 'Số điện thoại',
    required: true,
    type: 'tel',
    pattern: '[0-9+]{9,15}',
    maxLength: 15,
  },
  { name: 'email', label: 'Email', type: 'email' },
  {
    name: 'note',
    label: 'Ghi chú',
    type: 'textarea',
    placeholder: 'Sở thích, yêu cầu đặc biệt...',
  },
]
export function Customers() {
  const query = useCustomers()
  const [search, setSearch] = useState(''),
    [edit, setEdit] = useState<Customer | false | null>(null),
    [remove, setRemove] = useState<Customer | null>(null)
  if (query.isPending) return <Loading />
  if (query.error) return <ErrorBox error={query.error} />
  const rows = (query.data || []).filter((c) => matches(`${c.name} ${c.phone} ${c.email}`, search))
  return (
    <>
      <PageTitle
        title="Khách hàng"
        description="Ghi nhớ từng vị khách, xây dựng những kết nối lâu dài."
      >
        <Button variant="default" onClick={() => setEdit(false)}>
          <Plus size={18} />
          Thêm khách hàng
        </Button>
      </PageTitle>
      <section className="panel">
        <div className="list-toolbar">
          <h2>
            <Users size={20} />
            Danh sách khách hàng <span className="count-label">{query.data?.length}</span>
          </h2>
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm tên, số điện thoại..." />
        </div>
        <DataTable
          rows={rows}
          columns={[
            {
              label: 'Khách hàng',
              render: (c) => (
                <div className="name-cell">
                  <Avatar>
                    <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <b>{c.name}</b>
                    <small>KH{String(c.id).padStart(4, '0')}</small>
                  </div>
                </div>
              ),
            },
            { label: 'Số điện thoại', render: (c) => c.phone },
            { label: 'Email', render: (c) => c.email || '—' },
            { label: 'Ghi chú', render: (c) => <span className="muted">{c.note || '—'}</span> },
          ]}
          onEdit={setEdit}
          onDelete={setRemove}
        />
      </section>
      {edit !== null && (
        <Editor
          title={edit ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng'}
          fields={customerFields}
          initial={edit ? record(edit) : {}}
          path={`/pos/customers${edit ? `/${edit.id}` : ''}`}
          onClose={() => setEdit(null)}
        />
      )}{' '}
      {remove && (
        <DeleteConfirm
          path={`/pos/customers/${remove.id}`}
          name={remove.name}
          onClose={() => setRemove(null)}
        />
      )}
    </>
  )
}
export function Employees() {
  const query = useQuery({ queryKey: ['employees'], queryFn: () => api<User[]>('/auth/users') })
  const [search, setSearch] = useState(''),
    [edit, setEdit] = useState<User | false | null>(null)
  if (query.isPending) return <Loading />
  if (query.error) return <ErrorBox error={query.error} />
  const fields: FieldSpec[] = [
    { name: 'name', label: 'Họ và tên', required: true, maxLength: 100 },
    {
      name: 'username',
      label: 'Tên đăng nhập',
      required: true,
      pattern: '[a-zA-Z0-9._-]+',
      maxLength: 60,
    },
    {
      name: 'password',
      label: edit ? 'Mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu (ít nhất 8 ký tự)',
      type: 'password',
      required: !edit,
      maxLength: 72,
    },
    {
      name: 'role',
      label: 'Vai trò',
      options: [
        { value: 'CASHIER', label: 'Thu ngân' },
        { value: 'MANAGER', label: 'Quản lý' },
        { value: 'ADMIN', label: 'Quản trị viên' },
      ],
    },
    { name: 'enabled', label: 'Trạng thái tài khoản', type: 'checkbox' },
  ]
  return (
    <>
      <PageTitle
        title="Nhân viên"
        description="Quản lý đội ngũ và quyền truy cập của từng tài khoản."
      >
        <Button variant="default" onClick={() => setEdit(false)}>
          <Plus size={18} />
          Thêm nhân viên
        </Button>
      </PageTitle>
      <section className="panel">
        <div className="list-toolbar">
          <h2>
            Đội ngũ của bạn <span className="count-label">{query.data?.length}</span>
          </h2>
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm nhân viên..." />
        </div>
        <DataTable
          rows={(query.data || []).filter((u) => matches(`${u.name} ${u.username}`, search))}
          columns={[
            {
              label: 'Nhân viên',
              render: (u) => (
                <div className="name-cell">
                  <Avatar>
                    <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <b>{u.name}</b>
                </div>
              ),
            },
            { label: 'Tên đăng nhập', render: (u) => u.username },
            {
              label: 'Vai trò',
              render: (u) => (
                <Badge variant="secondary" className="badge blue">
                  {{ ADMIN: 'Quản trị viên', MANAGER: 'Quản lý', CASHIER: 'Thu ngân' }[u.role]}
                </Badge>
              ),
            },
            {
              label: 'Trạng thái',
              render: (u) => (
                <Badge variant="secondary" className={`badge ${u.enabled ? 'green' : 'gray'}`}>
                  {u.enabled ? 'Hoạt động' : 'Đã khóa'}
                </Badge>
              ),
            },
          ]}
          onEdit={setEdit}
        />
      </section>
      {edit !== null && (
        <Editor
          title={edit ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên'}
          fields={fields}
          initial={edit ? record(edit) : { role: 'CASHIER', enabled: true }}
          path={`/auth/users${edit ? `/${edit.id}` : ''}`}
          onClose={() => setEdit(null)}
        />
      )}
    </>
  )
}
export function Permissions() {
  const rules = useQuery({ queryKey: ['rules'], queryFn: () => api<Rule[]>('/permissions/rules') }),
    menus = useMenus()
  const [tab, setTab] = useState('roles'),
    [add, setAdd] = useState(false),
    [editMenu, setEditMenu] = useState<Menu | null>(null),
    [remove, setRemove] = useState<{ path: string; name: string } | null>(null)
  if (rules.isPending || menus.isPending) return <Loading />
  if (rules.error || menus.error) return <ErrorBox error={rules.error || menus.error} />
  const menuFields: FieldSpec[] = [
    { name: 'label', label: 'Tên menu', required: true, maxLength: 80 },
    {
      name: 'path',
      label: 'Đường dẫn màn hình',
      required: true,
      options: [
        '/ban-hang',
        '/thuc-don',
        '/khach-hang',
        '/hoa-don',
        '/bao-cao',
        '/tat-toan',
        '/nhan-vien',
        '/phan-quyen',
      ].map((p) => ({ value: p, label: p })),
    },
    {
      name: 'icon',
      label: 'Biểu tượng',
      options: ['layout', 'coffee', 'users', 'receipt', 'chart', 'wallet', 'staff', 'shield'].map(
        (p) => ({ value: p, label: p }),
      ),
    },
    {
      name: 'roles',
      label: 'Vai trò được xem (phân cách bằng dấu phẩy)',
      required: true,
      placeholder: 'ADMIN,MANAGER,CASHIER',
    },
    {
      name: 'parentId',
      label: 'Menu cha',
      type: 'numeric-select',
      options: [
        { value: '', label: 'Không có (menu cấp 1)' },
        ...(menus.data || [])
          .filter((m) => !m.parentId && m.id !== editMenu?.id)
          .map((m) => ({ value: m.id, label: m.label })),
      ],
    },
    { name: 'sortOrder', label: 'Thứ tự hiển thị', type: 'number', min: 0, required: true },
  ]
  return (
    <>
      <PageTitle
        title="Phân quyền"
        description="Cấp quyền sử dụng từng chức năng cho Thu ngân và Quản lý."
      >
        {tab !== 'roles' && (
          <Button variant="default" onClick={() => setAdd(true)}>
            <Plus size={18} />
            {tab === 'rules' ? 'Thêm quyền' : 'Thêm menu'}
          </Button>
        )}
      </PageTitle>
      <Alert className="info-box flex items-center gap-3">
        <ShieldCheck size={21} />
        <span>
          Chỉ Admin được cấp quyền. Nhân viên chỉ được sử dụng những chức năng đã được cho phép.
        </span>
      </Alert>
      <Tabs className="panel mt-5" value={tab} onValueChange={setTab}>
        <div className="list-toolbar">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="roles">Cấp quyền theo vai trò</TabsTrigger>
            <TabsTrigger value="rules">Quyền API nâng cao</TabsTrigger>
            <TabsTrigger value="menus">Menu & menu con</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="roles" forceMount className="data-[state=inactive]:hidden">
          <RolePermissions />
        </TabsContent>
        <TabsContent value={tab === 'roles' ? 'rules' : tab}>
          {tab === 'roles' ? null : tab === 'rules' ? (
            <div className="data-table-wrap">
              <Table className="data-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Phương thức</TableHead>
                    <TableHead>Đường dẫn API</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.data?.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Badge variant="secondary" className="badge blue">
                          {r.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code>{r.method}</code>
                      </TableCell>
                      <TableCell>
                        <code>{r.path}</code>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Xóa quyền ${r.id}`}
                          className="text-danger"
                          onClick={() =>
                            setRemove({
                              path: `/permissions/rules/${r.id}`,
                              name: `${r.role} ${r.method} ${r.path}`,
                            })
                          }
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <DataTable
              rows={menus.data || []}
              columns={[
                {
                  label: 'Menu',
                  render: (m) => (
                    <b>
                      {m.parentId ? '↳ ' : ''}
                      {m.label}
                    </b>
                  ),
                },
                { label: 'Đường dẫn', render: (m) => <code>{m.path}</code> },
                { label: 'Vai trò', render: (m) => m.roles },
                { label: 'Thứ tự', render: (m) => m.sortOrder },
              ]}
              onEdit={setEditMenu}
              onDelete={(m) => setRemove({ path: `/permissions/menus/${m.id}`, name: m.label })}
            />
          )}
        </TabsContent>
      </Tabs>
      {add && tab === 'rules' && (
        <Editor
          title="Thêm quyền truy cập"
          fields={[
            {
              name: 'role',
              label: 'Vai trò',
              options: ['CASHIER', 'MANAGER'].map((v) => ({ value: v, label: v })),
            },
            {
              name: 'method',
              label: 'Phương thức HTTP',
              options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', '*'].map((v) => ({
                value: v,
                label: v,
              })),
            },
            {
              name: 'path',
              label: 'Đường dẫn API (hỗ trợ /**)',
              required: true,
              placeholder: '/api/pos/reports',
            },
          ]}
          initial={{ role: 'CASHIER', method: 'GET' }}
          path="/permissions/rules"
          onClose={() => setAdd(false)}
        />
      )}{' '}
      {((add && tab === 'menus') || editMenu) && (
        <Editor
          title={editMenu ? 'Chỉnh sửa menu' : 'Thêm menu'}
          fields={menuFields}
          initial={
            editMenu
              ? record(editMenu)
              : { path: '/ban-hang', icon: 'layout', roles: 'ADMIN,MANAGER', sortOrder: 10 }
          }
          path={`/permissions/menus${editMenu ? `/${editMenu.id}` : ''}`}
          onClose={() => {
            setAdd(false)
            setEditMenu(null)
          }}
        />
      )}
      {remove && <DeleteConfirm {...remove} onClose={() => setRemove(null)} />}
    </>
  )
}

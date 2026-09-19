import { useEffect } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Coffee,
  LayoutGrid,
  Users,
  ReceiptText,
  ChartNoAxesCombined,
  Wallet,
  UserRoundCog,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Leaf,
  PanelLeft,
  type LucideIcon,
} from 'lucide-react'
import { useSession } from './viewmodels/session'
import { useMenus } from './viewmodels/data'
import { Toast, Loading, ErrorBox } from './components/ui'
import { Login } from './views/Login'
import { Pos } from './views/Pos'
import { Catalog, Customers, Employees, Permissions } from './views/Management'
import { Invoices, Reports, Settlement } from './views/Business'
const icons: Record<string, LucideIcon> = {
  layout: LayoutGrid,
  coffee: Coffee,
  users: Users,
  receipt: ReceiptText,
  chart: ChartNoAxesCombined,
  wallet: Wallet,
  staff: UserRoundCog,
  shield: ShieldCheck,
}
const pages: Record<string, React.ReactNode> = {
  '/ban-hang': <Pos />,
  '/thuc-don': <Catalog />,
  '/khach-hang': <Customers />,
  '/hoa-don': <Invoices />,
  '/bao-cao': <Reports />,
  '/tat-toan': <Settlement />,
  '/nhan-vien': <Employees />,
  '/phan-quyen': <Permissions />,
}
function Workspace() {
  const { user, logout } = useSession()
  const menus = useMenus()
  const location = useLocation()
  const client = useQueryClient()
  const visibleMenus = (menus.data || []).filter(
    (m) => user?.role === 'ADMIN' || !['/phan-quyen', '/nhan-vien'].includes(m.path),
  )
  // Admin must retain access to permission management even if a menu was removed.
  if (user?.role === 'ADMIN' && !visibleMenus.some((m) => m.path === '/phan-quyen')) {
    visibleMenus.push({
      id: -1,
      label: 'Phân quyền',
      path: '/phan-quyen',
      icon: 'shield',
      roles: 'ADMIN',
      parentId: null,
      sortOrder: 99,
    })
  }
  const current = visibleMenus.find((m) => m.path === location.pathname)
  useEffect(() => {
    document.title = `${current?.label || 'Quản lý'} · Cafe Flow`
  }, [current?.label])
  if (menus.isPending) return <Loading />
  if (menus.error)
    return (
      <div className="boot-error">
        <ErrorBox error={menus.error} retry={() => menus.refetch()} />
        <button
          className="button secondary"
          onClick={() => {
            logout()
            client.clear()
          }}
        >
          Đăng xuất
        </button>
      </div>
    )
  const menu = visibleMenus
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="sidebar-logo" aria-label="Cafe Flow" to="/ban-hang">
          <Coffee size={28} />
          <span>flow.</span>
        </NavLink>
        <nav>
          {menu
            .filter((m) => !m.parentId || !menu.some((parent) => parent.id === m.parentId))
            .map((m) => {
              const Icon = icons[m.icon] || PanelLeft
              return (
                <div key={m.id}>
                  <NavLink
                    to={m.path}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    title={m.label}
                  >
                    <Icon size={22} />
                    <span>{m.label}</span>
                  </NavLink>
                  {menu
                    .filter((child) => child.parentId === m.id)
                    .map((child) => (
                      <NavLink key={child.id} to={child.path} className="nav-item sub-nav">
                        {child.label}
                      </NavLink>
                    ))}
                </div>
              )
            })}
        </nav>
        <button
          className="nav-item logout"
          onClick={() => {
            logout()
            client.clear()
          }}
          title="Đăng xuất"
        >
          <LogOut size={21} />
          <span>Đăng xuất</span>
        </button>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="shop-icon">
              <Leaf size={19} />
            </span>
            <strong>Cafe Flow</strong>
            <span className="branch">Chi nhánh trung tâm</span>
            <ChevronRight size={15} />
            <span>{current?.label || 'Trang không tồn tại'}</span>
          </div>
          <div className="topbar-right">
            <span className="today">
              {new Intl.DateTimeFormat('vi-VN', {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }).format(new Date())}
            </span>
            <div className="user-avatar">{user?.name.charAt(0)}</div>
            <div className="user-label">
              <b>{user?.name}</b>
              <small>
                {
                  { ADMIN: 'Quản trị viên', MANAGER: 'Quản lý', CASHIER: 'Thu ngân' }[
                    user?.role || 'CASHIER'
                  ]
                }
              </small>
            </div>
          </div>
        </header>
        <main className={location.pathname === '/ban-hang' ? 'pos-main' : 'page-main'}>
          {current ? (
            pages[location.pathname] || (
              <div className="empty">
                <h2>Menu chưa có màn hình</h2>
                <p>Hãy cấu hình đường dẫn trỏ đến màn hình có sẵn.</p>
              </div>
            )
          ) : (
            <div className="empty">
              <ShieldCheck size={35} />
              <h2>Trang không khả dụng</h2>
              <p>Bạn không có quyền truy cập hoặc đường dẫn không tồn tại.</p>
              <NavLink className="button primary" to={menu[0]?.path || '/dang-nhap'}>
                Về trang chính
              </NavLink>
            </div>
          )}
        </main>
        <footer className="app-footer">
          <span>
            <span className="status-dot" /> Cafe Flow · Không gian quản lý của bạn
          </span>
          <span>Chăm chút từng ly, trọn vẹn từng trải nghiệm.</span>
        </footer>
      </div>
    </div>
  )
}
export default function App() {
  const token = useSession((s) => s.token)
  return (
    <>
      <Routes>
        <Route path="/dang-nhap" element={<Login />} />
        <Route path="/" element={<Navigate to={token ? '/ban-hang' : '/dang-nhap'} replace />} />
        <Route path="/*" element={token ? <Workspace /> : <Navigate to="/dang-nhap" replace />} />
      </Routes>
      <Toast />
    </>
  )
}

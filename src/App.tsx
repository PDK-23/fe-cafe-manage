import { lazy, Suspense, useEffect, type CSSProperties, type ReactNode } from 'react'
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
  PanelLeft,
  type LucideIcon,
} from 'lucide-react'
import { useSession } from './viewmodels/session'
import { useMenus } from './viewmodels/data'
import type { Menu } from './models/types'
import { Loading, ErrorBox, Empty } from './components/ui'
import { Button } from './components/ui/button'
import { Avatar, AvatarFallback } from './components/ui/avatar'
import { Separator } from './components/ui/separator'
import { Toaster } from './components/ui/sonner'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from './components/ui/sidebar'
import { Login } from './views/Login'
const Pos = lazy(() => import('./views/Pos').then((m) => ({ default: m.Pos })))
const Catalog = lazy(() => import('./views/Management').then((m) => ({ default: m.Catalog })))
const Customers = lazy(() => import('./views/Management').then((m) => ({ default: m.Customers })))
const Employees = lazy(() => import('./views/Management').then((m) => ({ default: m.Employees })))
const Permissions = lazy(() =>
  import('./views/Management').then((m) => ({ default: m.Permissions })),
)
const Invoices = lazy(() => import('./views/Business').then((m) => ({ default: m.Invoices })))
const Reports = lazy(() => import('./views/Business').then((m) => ({ default: m.Reports })))
const Settlement = lazy(() => import('./views/Business').then((m) => ({ default: m.Settlement })))

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
const pages: Record<string, ReactNode> = {
  '/ban-hang': <Pos />,
  '/thuc-don': <Catalog />,
  '/khach-hang': <Customers />,
  '/hoa-don': <Invoices />,
  '/bao-cao': <Reports />,
  '/tat-toan': <Settlement />,
  '/nhan-vien': <Employees />,
  '/phan-quyen': <Permissions />,
}

function Navigation({ menu, logout }: { menu: Menu[]; logout: () => void }) {
  const { setOpenMobile } = useSidebar()
  const { pathname } = useLocation()
  return (
    <Sidebar collapsible="offcanvas" className="classic-sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="classic-logo">
              <NavLink to="/ban-hang" aria-label="Cafe Flow" onClick={() => setOpenMobile(false)}>
                <Coffee />
                <strong>flow.</strong>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator />
      <SidebarContent className="classic-navigation">
        <SidebarMenu>
          {menu
            .filter((m) => !m.parentId || !menu.some((parent) => parent.id === m.parentId))
            .map((m) => {
              const Icon = icons[m.icon] || PanelLeft
              const children = menu.filter((child) => child.parentId === m.id)
              return (
                <SidebarMenuItem key={m.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === m.path}
                    tooltip={m.label}
                    className="classic-nav-item"
                  >
                    <NavLink to={m.path} onClick={() => setOpenMobile(false)}>
                      <Icon />
                      <span>{m.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                  {!!children.length && (
                    <SidebarMenuSub>
                      {children.map((child) => (
                        <SidebarMenuSubItem key={child.id}>
                          <SidebarMenuSubButton asChild isActive={pathname === child.path}>
                            <NavLink to={child.path} onClick={() => setOpenMobile(false)}>
                              {child.label}
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              )
            })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip="Đăng xuất" className="classic-nav-item">
              <LogOut />
              <span>Đăng xuất</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function Workspace() {
  const { user, logout } = useSession()
  const menus = useMenus()
  const location = useLocation()
  const client = useQueryClient()
  const visibleMenus = (menus.data || []).filter(
    (m) => user?.role === 'ADMIN' || !['/phan-quyen', '/nhan-vien'].includes(m.path),
  )
  // Admin retains permission management even if its menu was removed.
  if (user?.role === 'ADMIN' && !visibleMenus.some((m) => m.path === '/phan-quyen'))
    visibleMenus.push({
      id: -1,
      label: 'Phân quyền',
      path: '/phan-quyen',
      icon: 'shield',
      roles: 'ADMIN',
      parentId: null,
      sortOrder: 99,
    })
  const current = visibleMenus.find((m) => m.path === location.pathname)
  const signOut = () => {
    logout()
    client.clear()
  }
  useEffect(() => {
    document.title = `${current?.label || 'Quản lý'} · Cafe Flow`
  }, [current?.label])
  if (menus.isPending) return <Loading />
  if (menus.error)
    return (
      <div className="space-y-4 p-6">
        <ErrorBox error={menus.error} retry={() => menus.refetch()} />
        <Button variant="outline" onClick={signOut}>
          Đăng xuất
        </Button>
      </div>
    )
  return (
    <SidebarProvider className="app-shell" style={{ '--sidebar-width': '104px' } as CSSProperties}>
      <Navigation menu={visibleMenus} logout={signOut} />
      <SidebarInset className="workspace-frame min-w-0 bg-muted/30">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background px-3">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger aria-label="Mở/thu gọn menu" />
            <Separator orientation="vertical" className="h-5" />
            <span className="truncate font-medium">{current?.label || 'Trang không tồn tại'}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Avatar>
              <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="hidden text-sm sm:block">
              <b>{user?.name}</b>
              <p className="text-muted-foreground">
                {
                  { ADMIN: 'Quản trị viên', MANAGER: 'Quản lý', CASHIER: 'Thu ngân' }[
                    user?.role || 'CASHIER'
                  ]
                }
              </p>
            </div>
          </div>
        </header>
        <div className={location.pathname === '/ban-hang' ? 'pos-main' : 'page-main'}>
          <Suspense fallback={<Loading />}>
            {current ? (
              pages[location.pathname] || (
                <Empty
                  title="Menu chưa có màn hình"
                  text="Hãy cấu hình đường dẫn trỏ đến màn hình có sẵn."
                />
              )
            ) : (
              <div className="space-y-4 p-8">
                <h2>Trang không khả dụng</h2>
                <p>Bạn không có quyền truy cập hoặc đường dẫn không tồn tại.</p>
                <Button asChild>
                  <NavLink to={visibleMenus[0]?.path || '/dang-nhap'}>Về trang chính</NavLink>
                </Button>
              </div>
            )}
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
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
      <Toaster
        richColors
        closeButton
        position="top-center"
        offset={8}
        mobileOffset={8}
        duration={5000}
      />
    </>
  )
}

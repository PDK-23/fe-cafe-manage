import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import {
  ArrowRight,
  Coffee,
  Eye,
  EyeOff,
  Leaf,
  ShieldCheck,
  ChartNoAxesCombined,
} from 'lucide-react'
import { api } from '../models/api'
import type { User } from '../models/types'
import { useSession } from '../viewmodels/session'
import { Field } from '../components/ui'
export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const session = useSession()
  const client = useQueryClient()
  const login = useMutation({
    mutationFn: () =>
      api<{ token: string; user: User }>('/auth/login', 'POST', { username, password }),
    onSuccess: (result) => {
      client.clear()
      session.login(result.token, result.user)
    },
  })
  if (session.token) return <Navigate to="/ban-hang" replace />
  function submit(e: FormEvent) {
    e.preventDefault()
    login.mutate()
  }
  return (
    <main className="login">
      <section className="login-story">
        <div className="brand">
          <div className="brand-icon">
            <Coffee size={27} />
          </div>
          <span>
            cafe<span className="brand-light">flow.</span>
          </span>
        </div>
        <div className="story-copy">
          <span className="eyebrow">MỖI NGÀY, MỘT KHỞI ĐẦU TỐT</span>
          <h1>
            Chăm chút từng ly.
            <br />
            Quản lý thật nhẹ nhàng.
          </h1>
          <p>Một không gian làm việc gọn gàng để bạn dành nhiều thời gian hơn cho khách hàng.</p>
          <div className="coffee-art">
            <div className="steam s1" />
            <div className="steam s2" />
            <div className="steam s3" />
            <div className="cup">
              <Coffee size={58} strokeWidth={1} />
            </div>
            <div className="saucer" />
            <span className="art-label">GOOD COFFEE. GREAT DAYS.</span>
          </div>
        </div>
        <div className="login-features">
          <span>
            <Leaf size={18} /> Bán hàng dễ dàng
          </span>
          <span>
            <ChartNoAxesCombined size={18} /> Số liệu rõ ràng
          </span>
          <span>
            <ShieldCheck size={18} /> Phân quyền an toàn
          </span>
        </div>
      </section>
      <section className="login-form">
        <div className="login-form-inner">
          <span className="pill">KHÔNG GIAN QUẢN LÝ CỦA BẠN</span>
          <h2>
            Chào mừng trở lại <span>☕</span>
          </h2>
          <p>Đăng nhập để bắt đầu một ngày làm việc hiệu quả.</p>
          <form onSubmit={submit}>
            <Field label="Tên đăng nhập">
              <input
                autoComplete="username"
                required
                autoFocus
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Field>
            <Field label="Mật khẩu">
              <div className="password-wrap">
                <input
                  autoComplete="current-password"
                  required
                  type={show ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            {login.error && (
              <p role="alert" className="form-error">
                {login.error.message}
              </p>
            )}
            <button disabled={login.isPending} className="button primary login-submit">
              {login.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="login-help">
            <ShieldCheck size={18} />
            <p>
              Tài khoản được cấp bởi quản trị viên của quán.
              <br />
              Liên hệ quản lý nếu bạn cần hỗ trợ đăng nhập.
            </p>
          </div>
        </div>
        <small className="login-footer">Cafe Flow © 2026 · Làm việc nhẹ nhàng hơn mỗi ngày</small>
      </section>
    </main>
  )
}

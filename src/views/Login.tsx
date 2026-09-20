import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { ArrowRight, Coffee, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { api } from '../models/api'
import type { User } from '../models/types'
import { useSession } from '../viewmodels/session'
import { Field } from '../components/ui'

export function Login() {
  const [username, setUsername] = useState(''),
    [password, setPassword] = useState(''),
    [show, setShow] = useState(false)
  const session = useSession(),
    client = useQueryClient()
  const login = useMutation({
    mutationFn: () =>
      api<{ token: string; user: User }>('/auth/login', 'POST', { username, password }),
    onSuccess: (result) => {
      client.clear()
      session.login(result.token, result.user)
    },
  })
  if (session.token) return <Navigate to="/ban-hang" replace />
  function submit(event: FormEvent) {
    event.preventDefault()
    login.mutate()
  }
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 p-5">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-3">
          <Coffee className="size-9 text-primary" />
          <CardTitle className="text-2xl">Cafe Flow</CardTitle>
          <CardDescription>Đăng nhập vào hệ thống quản lý quán cà phê.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <Field label="Tên đăng nhập">
              <Input
                autoComplete="username"
                required
                autoFocus
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Field>
            <Field label="Mật khẩu">
              <div className="relative">
                <Input
                  autoComplete="current-password"
                  className="pr-12"
                  required
                  type={show ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1 right-1"
                  aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </Field>
            {login.error && (
              <Alert variant="destructive">
                <AlertDescription>{login.error.message}</AlertDescription>
              </Alert>
            )}
            <Button disabled={login.isPending} className="w-full">
              {login.isPending && <Spinner />}
              {login.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
              <ArrowRight />
            </Button>
          </form>
        </CardContent>
        <CardFooter className="gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0" />
          Tài khoản được cấp bởi quản trị viên của quán.
        </CardFooter>
      </Card>
    </main>
  )
}

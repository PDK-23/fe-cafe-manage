import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '../models/types'
interface Session {
  token: string | null
  user: User | null
  login: (token: string, user: User) => void
  logout: () => void
}
export const useSession = create<Session>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'cafe-flow-session', storage: createJSONStorage(() => sessionStorage) },
  ),
)
interface UI {
  tableId: number | null
  notice: { text: string; error: boolean } | null
  selectTable: (id: number) => void
  notify: (text: string, error?: boolean) => void
  dismiss: () => void
}
export const useUI = create<UI>((set) => ({
  tableId: 8,
  notice: null,
  selectTable: (tableId) => set({ tableId }),
  notify: (text, error = false) => set({ notice: { text, error } }),
  dismiss: () => set({ notice: null }),
}))

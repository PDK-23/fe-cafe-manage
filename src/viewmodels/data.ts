import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../models/api'
import { useUI } from './session'
import type { Table, Product, Category, Customer, Menu, Day } from '../models/types'
export const useTables = () =>
  useQuery({
    queryKey: ['tables'],
    queryFn: () => api<Table[]>('/pos/tables'),
    refetchInterval: 15000,
  })
export const useProducts = () =>
  useQuery({ queryKey: ['products'], queryFn: () => api<Product[]>('/catalog/products') })
export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: () => api<Category[]>('/catalog/categories') })
export const useCustomers = () =>
  useQuery({ queryKey: ['customers'], queryFn: () => api<Customer[]>('/pos/customers') })
export const useMenus = () =>
  useQuery({
    queryKey: ['menus'],
    queryFn: () => api<Menu[]>('/permissions/menus'),
    refetchInterval: 10000,
  })
export const useDay = () => useQuery({ queryKey: ['day'], queryFn: () => api<Day>('/pos/day') })
export function useAction() {
  const client = useQueryClient()
  const notify = useUI((s) => s.notify)
  return useMutation({
    mutationFn: ({
      path,
      method = 'POST',
      body,
    }: {
      path: string
      method?: string
      body?: unknown
    }) => api<unknown>(path, method, body),
    onSuccess: async () => {
      await client.invalidateQueries()
    },
    onError: (error: Error) => {
      notify(error.message, true)
      void client.invalidateQueries()
    },
  })
}

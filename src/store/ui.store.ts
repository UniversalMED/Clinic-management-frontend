import { create } from 'zustand'

export type Toast = {
  id: string
  title?: string
  description?: string
}

type UiState = {
  sidebarOpen: boolean
  toasts: Toast[]
  toggleSidebar: () => void
  addToast: (t: Omit<Toast, 'id'> & { id?: string }) => void
  removeToast: (id: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  toasts: [],
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  addToast: (t) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { ...t, id: t.id ?? crypto.randomUUID() },
      ],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}))

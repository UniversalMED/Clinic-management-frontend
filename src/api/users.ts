import type { PaginatedResponse } from '@/types/api.types'
import type { Profile, Role } from '@/types/user.types'

import client from './client'

export type CreateUserPayload = {
  email: string
  password: string
  full_name: string
  role: Role
}

export type UpdateProfilePayload = {
  full_name: string
}

export type UpdateRolePayload = {
  role: Role
}

export const getMe = () =>
  client.get<Profile>('/api/users/me/').then((r) => r.data)

export const listUsers = (params?: {
  page?: number
  page_size?: number
  role?: string
  search?: string
}) =>
  client
    .get<PaginatedResponse<Profile>>('/api/users/', { params })
    .then((r) => r.data)

export const createUser = (data: CreateUserPayload) =>
  client.post<Profile>('/api/users/', data).then((r) => r.data)

export const updateRole = (id: string, data: UpdateRolePayload) =>
  client.patch<Profile>(`/api/users/${id}/role/`, data).then((r) => r.data)

export const updateProfile = (id: string, data: UpdateProfilePayload) =>
  client.patch<Profile>(`/api/users/${id}/`, data).then((r) => r.data)

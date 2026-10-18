import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as notificationService from '../services/notificationService'
import type { AppNotification } from '../types'

const queryKeys = {
  notifications: ['notifications'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: notificationService.getNotifications,
    staleTime: 30_000,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: notificationService.getUnreadCount,
    staleTime: 10_000,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: (_, notificationId) => {
      // Update notifications list
      queryClient.setQueryData(queryKeys.notifications, (old: AppNotification[] | undefined) =>
        old?.map((n) =>
          n.id === notificationId && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      )
      // Invalidate unread count
      void queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      // Invalidate both notifications and unread count
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
      void queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount })
    },
  })
}

export function useAddMockNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationService.addMockNotification,
    onSuccess: (newNotification) => {
      // Add to notifications list
      queryClient.setQueryData(queryKeys.notifications, (old: AppNotification[] | undefined) => [
        newNotification,
        ...(old || []),
      ])
      // Invalidate unread count
      void queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount })
    },
  })
}

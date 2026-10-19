import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { updateAppBadge } from '@/pwa/badge'
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount }).then(async () => {
        const count = await notificationService.getUnreadCount()
        void updateAppBadge(count)
      })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
      void queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount })
      void updateAppBadge(0)
    },
  })
}

export function useAddMockNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationService.addMockNotification,
    onSuccess: (newNotification) => {
      queryClient.setQueryData(queryKeys.notifications, (old: AppNotification[] | undefined) => [
        newNotification,
        ...(old || []),
      ])
      void queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount }).then(async () => {
        const count = await notificationService.getUnreadCount()
        void updateAppBadge(count)
      })
    },
  })
}

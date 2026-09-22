// src/hooks/useNotifications.js
// React Query hooks for notification operations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios.js';

// ---- Query Keys ----
export const notificationKeys = {
  all: ['notifications'],
  list: (params) => [...notificationKeys.all, 'list', params],
  unread: () => [...notificationKeys.all, 'unread'],
};

// ---- Fetch notifications ----
export const useNotifications = (params = { limit: 30 }) =>
  useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get('/notifications', { params });
      return data.data;
    },
  });

// ---- Fetch unread count ----
export const useUnreadCount = (enabled = true) =>
  useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: async () => {
      const { data } = await api.get('/notifications?limit=1');
      return data.data.unreadCount;
    },
    enabled,
    refetchInterval: 60000,
  });

// ---- Mark all as read ----
export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

// ---- Mark one as read ----
export const useMarkOneRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

// ---- Delete notification ----
export const useDeleteNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

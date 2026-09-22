// src/hooks/usePosts.js
// React Query hooks for all post operations

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

// ---- Query Keys ----
export const postKeys = {
  all: ['posts'],
  lists: () => [...postKeys.all, 'list'],
  list: (filters) => [...postKeys.lists(), filters],
  feed: () => [...postKeys.all, 'feed'],
  detail: (id) => [...postKeys.all, id],
  user: (userId) => [...postKeys.all, 'user', userId],
  search: (query) => [...postKeys.all, 'search', query],
};

// ---- Fetch all posts ----
export const usePosts = (params = {}) =>
  useQuery({
    queryKey: postKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get('/posts', { params });
      return data.data;
    },
    staleTime: 1000 * 60, // 1 min
  });

// ---- Fetch feed (infinite scroll) ----
export const useFeedInfinite = () =>
  useInfiniteQuery({
    queryKey: postKeys.feed(),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get('/posts/feed', {
        params: { page: pageParam, limit: 10 },
      });
      return data.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
    staleTime: 1000 * 30,
  });

// ---- Fetch single post ----
export const usePost = (id) =>
  useQuery({
    queryKey: postKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/posts/${id}`);
      return data.data.post;
    },
    enabled: !!id,
  });

// ---- Fetch posts by user ----
export const useUserPosts = (userId) =>
  useQuery({
    queryKey: postKeys.user(userId),
    queryFn: async () => {
      const { data } = await api.get(`/posts/user/${userId}`);
      return data.data;
    },
    enabled: !!userId,
  });

// ---- Search posts ----
export const useSearchPosts = (query, tags) =>
  useQuery({
    queryKey: postKeys.search({ query, tags }),
    queryFn: async () => {
      const { data } = await api.get('/posts/search', {
        params: { q: query, tags },
      });
      return data.data;
    },
    enabled: !!(query || tags),
    staleTime: 1000 * 30,
  });

// ---- Create post ----
export const useCreatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postData) => {
      const { data } = await api.post('/posts', postData);
      return data.data.post;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: postKeys.lists() });
      qc.invalidateQueries({ queryKey: postKeys.feed() });
      toast.success('Post published!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create post');
    },
  });
};

// ---- Update post ----
export const useUpdatePost = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates) => {
      const { data } = await api.put(`/posts/${id}`, updates);
      return data.data.post;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: postKeys.detail(id) });
      toast.success('Post updated!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update post');
    },
  });
};

// ---- Delete post ----
export const useDeletePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/posts/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: postKeys.lists() });
      qc.invalidateQueries({ queryKey: postKeys.feed() });
      toast.success('Post deleted');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete post');
    },
  });
};

// ---- Toggle like ----
export const useLikePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/posts/${id}/like`);
      return { id, ...data.data };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Action failed');
    },
  });
};

// ---- Toggle bookmark ----
export const useBookmarkPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/posts/${id}/bookmark`);
      return { id, ...data.data };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Action failed');
    },
  });
};

// ---- Fetch bookmarks ----
export const useBookmarks = () =>
  useQuery({
    queryKey: ['posts', 'bookmarks'],
    queryFn: async () => {
      const { data } = await api.get('/posts/bookmarks');
      return data.data;
    },
  });

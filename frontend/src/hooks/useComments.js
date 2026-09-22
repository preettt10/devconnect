// src/hooks/useComments.js
// React Query hooks for comment operations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

// ---- Query Keys ----
export const commentKeys = {
  all: ['comments'],
  post: (postId) => [...commentKeys.all, postId],
};

// ---- Fetch comments for a post ----
export const useComments = (postId) =>
  useQuery({
    queryKey: commentKeys.post(postId),
    queryFn: async () => {
      const { data } = await api.get(`/comments/post/${postId}`);
      return data.data;
    },
    enabled: !!postId,
  });

// ---- Add comment to a post ----
export const useAddComment = (postId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ content }) => {
      const { data } = await api.post(`/comments/post/${postId}`, { content });
      return data.data.comment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.post(postId) });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    },
  });
};

// ---- Reply to a comment ----
export const useReplyToComment = (postId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, content }) => {
      const { data } = await api.post(`/comments/${parentId}/reply`, { content });
      return data.data.reply;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.post(postId) });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to post reply');
    },
  });
};

// ---- Toggle comment like ----
export const useToggleCommentLike = (postId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId) => {
      const { data } = await api.post(`/comments/${commentId}/like`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.post(postId) });
    },
  });
};

// ---- Delete comment ----
export const useDeleteComment = (postId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId) => {
      await api.delete(`/comments/${commentId}`);
      return commentId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.post(postId) });
      toast.success('Comment deleted');
    },
  });
};

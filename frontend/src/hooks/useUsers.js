// src/hooks/useUsers.js
// React Query hooks for all user operations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

// ---- Query Keys ----
export const userKeys = {
  all: ['user'],
  profile: (username) => [...userKeys.all, username],
  followers: (userId) => [...userKeys.all, 'followers', userId],
  following: (userId) => [...userKeys.all, 'following', userId],
  search: (query) => ['search', 'users', query],
};

// ---- Fetch user profile ----
export const useUserProfile = (username) =>
  useQuery({
    queryKey: userKeys.profile(username),
    queryFn: async () => {
      const { data } = await api.get(`/users/${username}`);
      return data.data.user;
    },
    enabled: !!username,
  });

// ---- Fetch user's posts ----
export const useUserPostsList = (userId) =>
  useQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: async () => {
      const { data } = await api.get(`/posts/user/${userId}`);
      return data.data;
    },
    enabled: !!userId,
  });

// ---- Fetch followers ----
export const useFollowers = (userId) =>
  useQuery({
    queryKey: userKeys.followers(userId),
    queryFn: async () => {
      const { data } = await api.get(`/users/${userId}/followers`);
      return data.data;
    },
    enabled: !!userId,
  });

// ---- Fetch following ----
export const useFollowing = (userId) =>
  useQuery({
    queryKey: userKeys.following(userId),
    queryFn: async () => {
      const { data } = await api.get(`/users/${userId}/following`);
      return data.data;
    },
    enabled: !!userId,
  });

// ---- Search users ----
export const useSearchUsers = (query) =>
  useQuery({
    queryKey: userKeys.search(query),
    queryFn: async () => {
      const { data } = await api.get('/users/search', { params: { q: query } });
      return data.data;
    },
    enabled: !!query,
  });

// ---- Toggle follow/unfollow ----
export const useToggleFollow = (targetUsername) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (targetUserId) => {
      const { data } = await api.post(`/users/${targetUserId}/follow`);
      return data.data;
    },
    onSuccess: (data) => {
      toast.success(data.following ? `Following @${targetUsername}` : `Unfollowed @${targetUsername}`);
      qc.invalidateQueries({ queryKey: userKeys.profile(targetUsername) });
      qc.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Action failed');
    },
  });
};

// ---- Update profile ----
export const useUpdateProfile = (username) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => {
      const skillsArr = formData.skills
        ? formData.skills.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
        : [];
      const { data } = await api.put('/users/profile', { ...formData, skills: skillsArr });
      return data.data.user;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.profile(username) });
      toast.success('Profile updated!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Update failed');
    },
  });
};

// ---- Upload avatar ----
export const useUploadAvatar = (username) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data.avatar;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.profile(username) });
      toast.success('Avatar updated!');
    },
    onError: () => {
      toast.error('Upload failed');
    },
  });
};

// ---- Remove avatar ----
export const useRemoveAvatar = (username) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete('/users/avatar');
      return data.data.user;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.profile(username) });
      toast.success('Avatar removed!');
    },
    onError: () => {
      toast.error('Remove failed');
    },
  });
};

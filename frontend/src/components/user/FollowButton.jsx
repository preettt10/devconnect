// src/components/user/FollowButton.jsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, UserMinus } from 'lucide-react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../ui/Button.jsx';
import toast from 'react-hot-toast';

const FollowButton = ({ targetUserId, isFollowing, username, size = 'md' }) => {
  const { isAuthenticated, user } = useAuth();
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/users/${targetUserId}/follow`);
      return data.data;
    },
    onSuccess: (data) => {
      toast.success(data.following ? `Following @${username}` : `Unfollowed @${username}`);
      qc.invalidateQueries({ queryKey: ['user', username] });
      qc.invalidateQueries({ queryKey: ['user', user?.username] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Action failed');
    },
  });

  if (!isAuthenticated || user?._id === targetUserId) return null;

  return (
    <Button
      variant={isFollowing ? 'secondary' : 'primary'}
      size={size}
      isLoading={isPending}
      onClick={() => mutate()}
      id={`follow-btn-${targetUserId}`}
      leftIcon={isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
};

export default FollowButton;

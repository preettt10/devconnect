// src/pages/Following.jsx
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import FollowButton from '../components/user/FollowButton.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFollowing } from '../hooks/useUsers.js';

const Following = () => {
  const { user: currentUser } = useAuth();

  const { data, isLoading } = useFollowing(currentUser?._id);

  const following = data?.following || [];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
            <Users size={20} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Following</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Developers you are following</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : following.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-indigo-400" />
            </div>
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Not following anyone</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Follow developers to customize your feed and see their posts.
            </p>
            <Link to="/search" className="btn-primary inline-flex">
              Find developers to follow
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {following.map((u) => (
              <div key={u._id} className="card p-4 flex items-center gap-4 hover:border-[var(--color-border-light)] transition-colors">
                <Link to={`/profile/${u.username}`}>
                  <Avatar src={u.avatar} name={u.name} size="md" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${u.username}`}
                    className="font-semibold text-[var(--color-text-primary)] hover:text-indigo-400 transition-colors"
                  >
                    {u.name}
                  </Link>
                  <p className="text-xs text-[var(--color-text-muted)]">@{u.username}</p>
                  {u.bio && <p className="text-sm text-[var(--color-text-secondary)] line-clamp-1 mt-0.5">{u.bio}</p>}
                  {u.skills && u.skills.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {u.skills.slice(0, 3).map((s) => (
                        <Badge key={s} variant="brand">{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <FollowButton
                  targetUserId={u._id}
                  isFollowing={true}
                  username={u.username}
                  size="sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Following;

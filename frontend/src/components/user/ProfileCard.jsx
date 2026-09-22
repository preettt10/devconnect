// src/components/user/ProfileCard.jsx
import { Link } from 'react-router-dom';
import { GitBranch, ExternalLink } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import FollowButton from './FollowButton.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';

const ProfileCard = ({ user, postCount = 0 }) => {
  const { user: currentUser } = useAuth();
  const { isUserOnline } = useSocket();

  if (!user) return null;

  const isFollowing = currentUser
    ? user.followers?.some((f) => (f._id || f) === currentUser._id)
    : false;

  const online = isUserOnline(user._id);

  return (
    <div className="card p-6 animate-fade-in">
      <div className="flex flex-col items-center text-center">
        <Avatar
          src={user.avatar}
          name={user.name}
          size="2xl"
          online={online}
          className="mb-4"
        />

        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{user.name}</h2>
        <p className="text-[var(--color-text-muted)] text-sm mt-0.5">@{user.username}</p>

        {user.bio && (
          <p className="text-[var(--color-text-secondary)] text-sm mt-3 leading-relaxed line-clamp-3">
            {user.bio}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4 py-4 border-t border-b border-[var(--color-border)] w-full justify-center">
          <Link to={`/profile/${user.username}?tab=followers`} className="flex flex-col items-center hover:text-indigo-400 transition-colors">
            <span className="font-bold text-[var(--color-text-primary)]">{user.followerCount ?? user.followers?.length ?? 0}</span>
            <span className="text-xs text-[var(--color-text-muted)]">Followers</span>
          </Link>
          <Link to={`/profile/${user.username}?tab=following`} className="flex flex-col items-center hover:text-indigo-400 transition-colors">
            <span className="font-bold text-[var(--color-text-primary)]">{user.followingCount ?? user.following?.length ?? 0}</span>
            <span className="text-xs text-[var(--color-text-muted)]">Following</span>
          </Link>
          <div className="flex flex-col items-center">
            <span className="font-bold text-[var(--color-text-primary)]">{postCount}</span>
            <span className="text-xs text-[var(--color-text-muted)]">Posts</span>
          </div>
        </div>

        {/* Skills */}
        {user.skills && user.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
            {user.skills.slice(0, 8).map((skill) => (
              <Badge key={skill} variant="brand">{skill}</Badge>
            ))}
          </div>
        )}

        {/* Links */}
        <div className="flex items-center gap-3 mt-4">
          {user.githubUrl && (
            <a href={user.githubUrl} target="_blank" rel="noopener noreferrer"
              className="btn-ghost p-2 rounded-lg" title="GitHub">
              <GitBranch size={18} />
            </a>
          )}
          {user.portfolioUrl && (
            <a href={user.portfolioUrl} target="_blank" rel="noopener noreferrer"
              className="btn-ghost p-2 rounded-lg" title="Portfolio">
              <ExternalLink size={18} />
            </a>
          )}
        </div>

        {/* Follow button */}
        <div className="mt-4 w-full">
          <FollowButton
            targetUserId={user._id}
            isFollowing={isFollowing}
            username={user.username}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;

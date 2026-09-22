// src/components/post/PostCard.jsx
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, Clock, Eye } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLikePost, useBookmarkPost } from '../../hooks/usePosts.js';
import { formatDistanceToNow } from 'date-fns';

const PostCard = ({ post }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { mutate: likePost } = useLikePost();
  const { mutate: bookmarkPost } = useBookmarkPost();

  const isLiked = post.likes?.some((id) => (id._id || id) === user?._id);
  const isBookmarked = post.bookmarks?.some((id) => (id._id || id) === user?._id);

  const handleLike = (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    likePost(post._id);
  };

  const handleBookmark = (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    bookmarkPost(post._id);
  };

  return (
    <article className="card hover:border-[var(--color-border-light)] transition-all duration-200 hover:shadow-lg hover:shadow-black/20 group animate-fade-in">
      {/* Cover image */}
      {post.coverImage && (
        <Link to={`/posts/${post._id}`}>
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-44 object-cover rounded-t-xl"
          />
        </Link>
      )}

      <div className="p-5">
        {/* Author */}
        <div className="flex items-center gap-3 mb-3">
          <Link to={`/profile/${post.author?.username}`}>
            <Avatar
              src={post.author?.avatar}
              name={post.author?.name}
              size="sm"
            />
          </Link>
          <div>
            <Link
              to={`/profile/${post.author?.username}`}
              className="text-sm font-medium text-[var(--color-text-primary)] hover:text-indigo-400 transition-colors"
            >
              {post.author?.name}
            </Link>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              <span>·</span>
              <Clock size={11} />
              <span>{post.readTime} min read</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="muted">#{tag}</Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <Link to={`/posts/${post._id}`}>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-indigo-400 
                         transition-colors duration-200 line-clamp-2 mb-2 leading-tight">
            {post.title}
          </h2>
        </Link>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm transition-colors duration-200 hover:scale-105 active:scale-95 ${
                isLiked ? 'text-red-400' : 'text-[var(--color-text-muted)] hover:text-red-400'
              }`}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{post.likes?.length ?? 0}</span>
            </button>

            {/* Comments */}
            <Link
              to={`/posts/${post._id}#comments`}
              className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-indigo-400 transition-colors"
            >
              <MessageCircle size={16} />
              <span>{post.commentsCount ?? 0}</span>
            </Link>

            {/* Views */}
            <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
              <Eye size={16} />
              <span>{post.views ?? 0}</span>
            </span>
          </div>

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            className={`transition-colors duration-200 hover:scale-105 active:scale-95 ${
              isBookmarked ? 'text-indigo-400' : 'text-[var(--color-text-muted)] hover:text-indigo-400'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default PostCard;

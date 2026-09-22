// src/pages/PostDetail.jsx
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart, Bookmark, Clock, Eye, Share2, ArrowLeft, Trash2, Edit,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatDistanceToNow } from 'date-fns';
import AppLayout from '../components/layout/AppLayout.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import CommentList from '../components/comment/CommentList.jsx';
import CommentForm from '../components/comment/CommentForm.jsx';
import { usePost, useLikePost, useBookmarkPost, useDeletePost } from '../hooks/usePosts.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import Button from '../components/ui/Button.jsx';
import toast from 'react-hot-toast';

const PostDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: post, isLoading, isError } = usePost(id);
  const { mutate: likePost } = useLikePost();
  const { mutate: bookmarkPost } = useBookmarkPost();
  const { mutate: deletePost, isPending: deleting } = useDeletePost();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </AppLayout>
    );
  }

  if (isError || !post) {
    return (
      <AppLayout>
        <div className="card p-12 text-center">
          <h2 className="text-xl font-bold mb-2">Post not found</h2>
          <p className="text-[var(--color-text-muted)] mb-4">This post may have been deleted.</p>
          <Button onClick={() => navigate('/')}>Back to Feed</Button>
        </div>
      </AppLayout>
    );
  }

  const isLiked = post.likes?.some((id) => (id._id || id) === user?._id);
  const isBookmarked = post.bookmarks?.some((id) => (id._id || id) === user?._id);
  const isAuthor = user?._id === (post.author?._id || post.author);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleDelete = () => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    deletePost(post._id, {
      onSuccess: () => navigate('/'),
    });
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost mb-6 text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Cover */}
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-64 sm:h-80 object-cover rounded-2xl mb-8"
          />
        )}

        {/* Header */}
        <header className="mb-8">
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <Link key={tag} to={`/search?tags=${tag}`}>
                  <Badge variant="muted">#{tag}</Badge>
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] leading-tight mb-6">
            {post.title}
          </h1>

          {/* Author row */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Link to={`/profile/${post.author?.username}`}>
                <Avatar src={post.author?.avatar} name={post.author?.name} size="md" />
              </Link>
              <div>
                <Link
                  to={`/profile/${post.author?.username}`}
                  className="font-semibold text-[var(--color-text-primary)] hover:text-indigo-400 transition-colors"
                >
                  {post.author?.name}
                </Link>
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                  <span>·</span>
                  <Clock size={13} />
                  <span>{post.readTime} min read</span>
                  <span>·</span>
                  <Eye size={13} />
                  <span>{post.views} views</span>
                </div>
              </div>
            </div>

            {/* Author actions */}
            {isAuthor && (
              <div className="flex items-center gap-2">
                <Link to={`/edit/${post._id}`} className="btn-secondary text-sm">
                  <Edit size={14} /> Edit
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={deleting}
                  onClick={handleDelete}
                  id="delete-post"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="card p-6 sm:p-10 mb-8 prose-devconnect">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between card p-4 mb-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => likePost(post._id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isLiked
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'btn-ghost'
              }`}
              id="like-post"
            >
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{post.likes?.length ?? 0}</span>
            </button>

            <button
              onClick={() => bookmarkPost(post._id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isBookmarked
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'btn-ghost'
              }`}
              id="bookmark-post"
            >
              <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
              Bookmark
            </button>
          </div>

          <button onClick={handleShare} className="btn-ghost text-sm" id="share-post">
            <Share2 size={16} /> Share
          </button>
        </div>

        {/* Comments */}
        <div className="space-y-6">
          <CommentForm postId={post._id} />
          <div className="divider" />
          <CommentList postId={post._id} />
        </div>
      </div>
    </AppLayout>
  );
};

export default PostDetail;

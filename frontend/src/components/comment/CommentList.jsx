// src/components/comment/CommentList.jsx
import { useState } from 'react';
import { Heart, Reply, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext.jsx';
import Avatar from '../ui/Avatar.jsx';
import CommentForm from './CommentForm.jsx';
import {
  useComments,
  useToggleCommentLike,
  useDeleteComment,
} from '../../hooks/useComments.js';

const CommentItem = ({ comment, postId }) => {
  const { user, isAuthenticated } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const isLiked = comment.likes?.some((id) => (id._id || id) === user?._id);

  const { mutate: likeComment } = useToggleCommentLike(postId);
  const { mutate: deleteComment } = useDeleteComment(postId);

  return (
    <div className="flex gap-3 animate-fade-in">
      <Link to={`/profile/${comment.author?.username}`}>
        <Avatar src={comment.author?.avatar} name={comment.author?.name} size="sm" />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="card-elevated p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/profile/${comment.author?.username}`}
              className="text-sm font-medium text-[var(--color-text-primary)] hover:text-indigo-400 transition-colors"
            >
              {comment.author?.name}
            </Link>
            <span className="text-xs text-[var(--color-text-muted)]">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-1.5 px-1">
          <button
            onClick={() => isAuthenticated && likeComment(comment._id)}
            className={`flex items-center gap-1 text-xs transition-colors ${
              isLiked ? 'text-red-400' : 'text-[var(--color-text-muted)] hover:text-red-400'
            }`}
          >
            <Heart size={12} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{comment.likes?.length || 0}</span>
          </button>

          {isAuthenticated && (
            <button
              onClick={() => setShowReplyForm((v) => !v)}
              className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-indigo-400 transition-colors"
            >
              <Reply size={12} />
              Reply
            </button>
          )}

          {comment.replies?.length > 0 && (
            <button
              onClick={() => setShowReplies((v) => !v)}
              className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-indigo-400 transition-colors"
            >
              {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}

          {user?._id === comment.author?._id && (
            <button
              onClick={() => deleteComment(comment._id)}
              className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-red-400 transition-colors ml-auto"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-3">
            <CommentForm
              postId={postId}
              parentId={comment._id}
              placeholder={`Reply to ${comment.author?.name}...`}
              onSuccess={() => {
                setShowReplyForm(false);
                setShowReplies(true);
              }}
            />
          </div>
        )}

        {/* Nested replies */}
        {showReplies && comment.replies?.length > 0 && (
          <div className="mt-3 space-y-3 pl-2 border-l-2 border-[var(--color-border)]">
            {comment.replies.map((reply) => (
              <CommentItem key={reply._id} comment={reply} postId={postId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CommentList = ({ postId }) => {
  const { data, isLoading } = useComments(postId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="skeleton w-8 h-8 rounded-full" />
            <div className="flex-1 skeleton h-16 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  const comments = data?.comments || [];

  return (
    <div id="comments" className="space-y-4">
      <h3 className="font-semibold text-[var(--color-text-primary)]">
        {data?.pagination?.total || 0} Comments
      </h3>
      {comments.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-sm text-center py-8">
          No comments yet. Be the first!
        </p>
      ) : (
        comments.map((comment) => (
          <CommentItem key={comment._id} comment={comment} postId={postId} />
        ))
      )}
    </div>
  );
};

export default CommentList;

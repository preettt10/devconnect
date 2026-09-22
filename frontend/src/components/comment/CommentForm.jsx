// src/components/comment/CommentForm.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.jsx';
import Avatar from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';
import { useAddComment, useReplyToComment } from '../../hooks/useComments.js';

const schema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Too long'),
});

const CommentForm = ({ postId, parentId = null, onSuccess, placeholder = 'Write a comment...' }) => {
  const { user, isAuthenticated } = useAuth();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const { mutate: addComment, isPending: addingComment } = useAddComment(postId);
  const { mutate: replyToComment, isPending: replying } = useReplyToComment(postId);

  const isPending = parentId ? replying : addingComment;

  const onSubmit = ({ content }) => {
    if (parentId) {
      replyToComment({ parentId, content }, {
        onSuccess: (reply) => {
          reset();
          onSuccess?.(reply);
        },
      });
    } else {
      addComment({ content }, {
        onSuccess: (comment) => {
          reset();
          onSuccess?.(comment);
        },
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <p className="text-[var(--color-text-muted)] text-sm text-center py-4">
        <a href="/login" className="text-indigo-400 hover:underline">Sign in</a> to comment
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3">
      <Avatar src={user?.avatar} name={user?.name} size="sm" className="mt-0.5 flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <textarea
          {...register('content')}
          rows={3}
          placeholder={placeholder}
          className={`input resize-none text-sm ${errors.content ? 'input-error' : ''}`}
          id="comment-input"
        />
        {errors.content && (
          <p className="text-xs text-red-400">{errors.content.message}</p>
        )}
        <div className="flex justify-end">
          <Button type="submit" isLoading={isPending} size="sm">
            {parentId ? 'Reply' : 'Comment'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;

// src/pages/Bookmarks.jsx
import { useBookmarks } from '../hooks/usePosts.js';
import AppLayout from '../components/layout/AppLayout.jsx';
import PostCard from '../components/post/PostCard.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { Bookmark } from 'lucide-react';

const Bookmarks = () => {
  const { data, isLoading } = useBookmarks();
  const posts = data?.posts || [];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
            <Bookmark size={20} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Bookmarks</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Saved posts for later reading</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : posts.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bookmark size={28} className="text-indigo-400" />
            </div>
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">No bookmarked posts</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              When you find a post you like, bookmark it to view it here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Bookmarks;

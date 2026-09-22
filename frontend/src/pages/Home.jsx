// src/pages/Home.jsx
import { useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PenSquare, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useFeedInfinite, usePosts } from '../hooks/usePosts.js';
import AppLayout from '../components/layout/AppLayout.jsx';
import PostCard from '../components/post/PostCard.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useQueryClient } from '@tanstack/react-query';
import { postKeys } from '../hooks/usePosts.js';

const SkeletonCard = () => (
  <div className="card p-5 space-y-3">
    <div className="flex items-center gap-3">
      <div className="skeleton w-8 h-8 rounded-full" />
      <div className="space-y-1.5 flex-1">
        <div className="skeleton h-3 w-28 rounded" />
        <div className="skeleton h-2.5 w-20 rounded" />
      </div>
    </div>
    <div className="skeleton h-5 w-3/4 rounded" />
    <div className="skeleton h-4 w-full rounded" />
    <div className="skeleton h-4 w-2/3 rounded" />
  </div>
);

const Home = () => {
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const qc = useQueryClient();
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Use feed for authenticated, all posts for guests
  const feedQuery = useFeedInfinite();
  const allPostsQuery = usePosts({ sort: 'createdAt', order: 'desc' });

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
        feedQuery.fetchNextPage();
      }
    },
    [feedQuery]
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    observerRef.current = new IntersectionObserver(handleObserver, { rootMargin: '200px' });
    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [handleObserver]);

  // Listen for new notifications via socket → invalidate feed
  useEffect(() => {
    if (!socket) return;
    const handler = () => qc.invalidateQueries({ queryKey: postKeys.feed() });
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [socket, qc]);

  const posts = isAuthenticated
    ? feedQuery.data?.pages.flatMap((p) => p.posts) ?? []
    : allPostsQuery.data?.posts ?? [];

  const isLoading = isAuthenticated ? feedQuery.isLoading : allPostsQuery.isLoading;

  return (
    <AppLayout>
      <div className="max-w-2xl">
        {/* Hero banner for guests */}
        {!isAuthenticated && (
          <div className="card p-8 mb-8 relative overflow-hidden animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={18} className="text-indigo-400" />
                <span className="text-indigo-400 text-sm font-medium">Developer Community</span>
              </div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3 leading-tight">
                Where developers<br />
                <span className="gradient-text">share and learn</span>
              </h1>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Join thousands of developers writing about web dev, open source, career growth, and more.
              </p>
              <div className="flex gap-3">
                <Link to="/register" className="btn-primary">
                  <PenSquare size={16} />
                  Start writing
                </Link>
                <Link to="/search" className="btn-secondary">
                  <TrendingUp size={16} />
                  Explore
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Write prompt for auth users */}
        {isAuthenticated && (
          <Link
            to="/create"
            className="card p-4 mb-6 flex items-center gap-3 hover:border-indigo-500/40 
                       transition-all duration-200 group animate-fade-in block"
            id="home-write-prompt"
          >
            <div className="w-9 h-9 bg-indigo-600/20 rounded-lg flex items-center justify-center 
                            group-hover:bg-indigo-600/30 transition-colors">
              <PenSquare size={18} className="text-indigo-400" />
            </div>
            <span className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors">
              What's on your mind? Write something...
            </span>
          </Link>
        )}

        {/* Posts */}
        <div className="space-y-5">
          {isLoading ? (
            [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          ) : posts.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={28} className="text-indigo-400" />
              </div>
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
                {isAuthenticated ? 'Your feed is empty' : 'No posts yet'}
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                {isAuthenticated
                  ? 'Follow some developers to see their posts here.'
                  : 'Be the first to publish something.'}
              </p>
              <Link
                to={isAuthenticated ? '/search' : '/create'}
                className="btn-primary inline-flex"
              >
                {isAuthenticated ? 'Discover developers' : 'Write first post'}
              </Link>
            </div>
          ) : (
            posts.map((post) => <PostCard key={post._id} post={post} />)
          )}

          {/* Infinite scroll sentinel */}
          {isAuthenticated && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {feedQuery.isFetchingNextPage && <Spinner />}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Home;

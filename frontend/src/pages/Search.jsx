// src/pages/Search.jsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Users, FileText, X } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout.jsx';
import PostCard from '../components/post/PostCard.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { Link } from 'react-router-dom';
import FollowButton from '../components/user/FollowButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSearchPosts } from '../hooks/usePosts.js';
import { useSearchUsers } from '../hooks/useUsers.js';

const POPULAR_TAGS = ['javascript', 'react', 'python', 'typescript', 'nodejs', 'css', 'nextjs', 'devops'];

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('posts');
  const { user: currentUser } = useAuth();

  const [showSuggestions, setShowSuggestions] = useState(false);

  const q = searchParams.get('q') || '';
  const tags = searchParams.get('tags') || '';

  const [prevQ, setPrevQ] = useState(q);
  const [inputValue, setInputValue] = useState(q);

  if (q !== prevQ) {
    setPrevQ(q);
    setInputValue(q);
  }

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
      setShowSuggestions(false);
    }
  };

  const handleTagClick = (tag) => {
    setSearchParams({ tags: tag });
    setInputValue('');
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchParams({});
    setInputValue('');
    setShowSuggestions(false);
  };

  // Search posts
  const { data: postsData, isLoading: postsLoading } = useSearchPosts(q || undefined, tags || undefined);

  // Search users
  const { data: usersData, isLoading: usersLoading } = useSearchUsers(q);

  // Suggestions queries (only active when suggestions popup is visible and query is typed)
  const isSuggesting = showSuggestions && inputValue.trim().length > 0;

  const { data: userSuggestionsData, isLoading: userSuggestionsLoading } = useSearchUsers(
    isSuggesting ? inputValue.trim() : ''
  );
  const { data: postSuggestionsData, isLoading: postSuggestionsLoading } = useSearchPosts(
    isSuggesting ? inputValue.trim() : undefined,
    undefined
  );

  const userSuggestions = userSuggestionsData?.users?.slice(0, 3) || [];
  const postSuggestions = postSuggestionsData?.posts?.slice(0, 3) || [];
  const hasSuggestions = userSuggestions.length > 0 || postSuggestions.length > 0;

  const hasQuery = !!(q || tags);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
          {hasQuery ? `Results for "${q || '#' + tags}"` : 'Explore'}
        </h1>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative mb-6">
          <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search posts, developers, topics..."
            className="input pl-11 pr-10 h-12"
            id="search-input"
            autoFocus={!hasQuery}
            autoComplete="off"
          />
          {(inputValue || hasQuery) && (
            <button type="button" onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
              <X size={16} />
            </button>
          )}

          {/* Autocomplete dropdown suggestions */}
          {showSuggestions && inputValue.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 card p-4 shadow-2xl animate-scale-in bg-[var(--color-bg-card)] max-h-96 overflow-y-auto">
              {userSuggestionsLoading || postSuggestionsLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : !hasSuggestions ? (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-2">
                  No quick matches found
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Developers suggestions */}
                  {userSuggestions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                        Developers
                      </h4>
                      <div className="space-y-2">
                        {userSuggestions.map((u) => (
                          <Link
                            key={u._id}
                            to={`/profile/${u.username}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
                          >
                            <Avatar src={u.avatar} name={u.name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                                {u.name}
                              </p>
                              <p className="text-xs text-[var(--color-text-muted)] truncate">
                                @{u.username}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Posts suggestions */}
                  {postSuggestions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                        Posts
                      </h4>
                      <div className="space-y-2">
                        {postSuggestions.map((p) => (
                          <Link
                            key={p._id}
                            to={`/posts/${p._id}`}
                            className="block p-2 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
                          >
                            <p className="text-sm font-medium text-[var(--color-text-primary)] hover:text-indigo-400 transition-colors truncate">
                              {p.title}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                              {p.readTime} min read
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Popular tags */}
        {!hasQuery && (
          <div className="mb-8 animate-fade-in">
            <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
              Popular Topics
            </h2>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.map((tag) => (
                <button key={tag} onClick={() => handleTagClick(tag)}
                  className="badge badge-muted hover:badge-brand cursor-pointer transition-colors text-sm px-3 py-1.5">
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        {hasQuery && (
          <>
            <div className="flex gap-1 mb-6 border-b border-[var(--color-border)]">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === 'posts'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
                id="tab-posts"
              >
                <FileText size={15} />
                Posts {postsData?.pagination?.total != null && `(${postsData.pagination.total})`}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === 'users'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
                id="tab-users"
              >
                <Users size={15} />
                Developers {usersData?.pagination?.total != null && `(${usersData.pagination.total})`}
              </button>
            </div>

            {/* Posts results */}
            {activeTab === 'posts' && (
              <div className="space-y-4 animate-fade-in">
                {postsLoading ? (
                  <div className="flex justify-center py-12"><Spinner /></div>
                ) : postsData?.posts?.length === 0 ? (
                  <div className="card p-12 text-center">
                    <p className="text-[var(--color-text-muted)]">No posts found for this search.</p>
                  </div>
                ) : (
                  postsData?.posts?.map((post) => <PostCard key={post._id} post={post} />)
                )}
              </div>
            )}

            {/* Users results */}
            {activeTab === 'users' && (
              <div className="space-y-3 animate-fade-in">
                {usersLoading ? (
                  <div className="flex justify-center py-12"><Spinner /></div>
                ) : usersData?.users?.length === 0 ? (
                  <div className="card p-12 text-center">
                    <p className="text-[var(--color-text-muted)]">No developers found.</p>
                  </div>
                ) : (
                  usersData?.users?.map((u) => {
                    const isFollowing = currentUser
                      ? u.followers?.some((f) => (f._id || f) === currentUser._id)
                      : false;
                    return (
                      <div key={u._id} className="card p-4 flex items-center gap-4">
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
                              {u.skills.slice(0, 4).map((s) => (
                                <Badge key={s} variant="brand">{s}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <FollowButton
                          targetUserId={u._id}
                          isFollowing={isFollowing}
                          username={u.username}
                          size="sm"
                        />
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Search;

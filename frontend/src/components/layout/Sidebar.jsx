// src/components/layout/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Bookmark, Users, Hash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home Feed' },
  { to: '/search', icon: TrendingUp, label: 'Explore' },
  { to: '/search?tags=javascript', icon: Hash, label: 'JavaScript' },
  { to: '/search?tags=react', icon: Hash, label: 'React' },
  { to: '/search?tags=python', icon: Hash, label: 'Python' },
];

const AUTH_ITEMS = [
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks', auth: true },
  { to: '/following', icon: Users, label: 'Following', auth: true },
];

const Sidebar = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isActive = (path) => location.pathname === path || location.pathname + location.search === path;

  return (
    <aside className="hidden lg:block w-60 flex-shrink-0">
      <div className="sticky top-20 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive(to)
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]'
              }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}

        {isAuthenticated && (
          <>
            <div className="border-t border-[var(--color-border)] my-3" />
            <p className="px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
              My Space
            </p>
            {AUTH_ITEMS.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive(to)
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]'
                  }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

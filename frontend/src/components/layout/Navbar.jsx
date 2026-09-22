// src/components/layout/Navbar.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Code2, Bell, Search, Plus, LogOut, User, Menu, X, Bookmark, Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useQueryClient } from '@tanstack/react-query';
import { useUnreadCount } from '../../hooks/useNotifications.js';
import Avatar from '../ui/Avatar.jsx';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const qc = useQueryClient();

  // Unread notification count
  const { data: unreadCount = 0 } = useUnreadCount(isAuthenticated);

  const handleLogout = async () => {
    await logout();
    qc.clear();
    navigate('/login');
  };


  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg gradient-text hidden sm:block">DevConnect</span>
          </Link>

          {/* Center search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <button
              onClick={() => navigate('/search')}
              className="w-full flex items-center gap-3 px-4 py-2 bg-[var(--color-bg-secondary)] 
                         border border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)] 
                         hover:border-indigo-500/50 transition-all duration-200 text-sm"
            >
              <Search size={15} />
              <span>Search posts, developers...</span>
              <kbd className="ml-auto text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border)] 
                              rounded px-1.5 py-0.5">/</kbd>
            </button>
          </div>

          {/* Right side */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Write button */}
              <Link
                to="/create"
                className="hidden sm:flex btn-primary text-sm"
                id="nav-write-post"
              >
                <Plus size={16} />
                Write
              </Link>

              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative btn-ghost p-2 rounded-lg"
                id="nav-notifications"
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 
                                   rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile menu */}
              <div className="relative group">
                <button
                  className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-[var(--color-bg-elevated)] transition-colors"
                  id="nav-profile"
                >
                  <Avatar
                    src={user?.avatar}
                    name={user?.name}
                    size="sm"
                    online={isConnected}
                  />
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-56 card shadow-xl shadow-black/30 
                                opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                                transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50">
                  <div className="p-3 border-b border-[var(--color-border)]">
                    <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">{user?.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">@{user?.username}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      to={`/profile/${user?.username}`}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm 
                                 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] 
                                 hover:bg-[var(--color-bg-elevated)] transition-colors"
                    >
                      <User size={15} /> Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm 
                                 text-red-400 hover:bg-red-500/10 transition-colors"
                      id="nav-logout"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile menu toggle */}
              <button
                className="md:hidden btn-ghost p-2"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost text-sm" id="nav-login">Sign in</Link>
              <Link to="/register" className="btn-primary text-sm" id="nav-register">Get started</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && isAuthenticated && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-2 animate-slide-up">
          <Link to="/search" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 btn-ghost w-full">
            <Search size={16} /> Search
          </Link>
          <Link to="/create" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 btn-ghost w-full">
            <Plus size={16} /> Write Post
          </Link>
          <Link to="/notifications" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 btn-ghost w-full">
            <Bell size={16} /> Notifications
            {unreadCount > 0 && <span className="badge badge-brand">{unreadCount}</span>}
          </Link>
          <Link to="/bookmarks" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 btn-ghost w-full">
            <Bookmark size={16} /> Bookmarks
          </Link>
          <Link to="/following" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 btn-ghost w-full">
            <Users size={16} /> Following
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

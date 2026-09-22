// src/pages/Notifications.jsx
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, Reply, Bell, CheckCheck, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AppLayout from '../components/layout/AppLayout.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import {
  useNotifications,
  useMarkAllRead,
  useMarkOneRead,
  useDeleteNotification,
  notificationKeys,
} from '../hooks/useNotifications.js';
import toast from 'react-hot-toast';

const ICONS = {
  like: { icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10' },
  comment: { icon: MessageCircle, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  follow: { icon: UserPlus, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  reply: { icon: Reply, color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

const Notifications = () => {
  const qc = useQueryClient();
  const { socket } = useSocket();

  const { data, isLoading } = useNotifications({ limit: 30 });
  const { mutate: markAllRead } = useMarkAllRead();
  const { mutate: markOneRead } = useMarkOneRead();
  const { mutate: deleteNotif } = useDeleteNotification();

  // Listen for new real-time notifications
  useEffect(() => {
    if (!socket) return;
    const handler = (notification) => {
      toast.custom((t) => (
        <div className={`card p-4 flex items-center gap-3 shadow-xl max-w-sm ${t.visible ? 'animate-slide-up' : ''}`}>
          <Bell size={18} className="text-indigo-400 flex-shrink-0" />
          <span className="text-sm text-[var(--color-text-secondary)]">{notification.message}</span>
        </div>
      ), { duration: 4000 });
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    };
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [socket, qc]);

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                {unreadCount} unread
              </p>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead()}
              leftIcon={<CheckCheck size={14} />}
              id="mark-all-read"
            >
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : notifications.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell size={28} className="text-indigo-400" />
            </div>
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">All caught up!</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              You have no notifications yet. Start engaging with posts!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const config = ICONS[notif.type] || ICONS.like;
              const IconComp = config.icon;

              return (
                <div
                  key={notif._id}
                  className={`card p-4 flex items-start gap-4 transition-all duration-200 cursor-pointer
                             hover:border-[var(--color-border-light)] ${
                    !notif.isRead ? 'border-l-2 border-l-indigo-500' : ''
                  }`}
                  onClick={() => !notif.isRead && markOneRead(notif._id)}
                >
                  {/* Type icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    <IconComp size={16} className={config.color} />
                  </div>

                  {/* Sender avatar */}
                  <Link to={`/profile/${notif.sender?.username}`} onClick={(e) => e.stopPropagation()}>
                    <Avatar src={notif.sender?.avatar} name={notif.sender?.name} size="sm" />
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      <Link
                        to={`/profile/${notif.sender?.username}`}
                        className="font-semibold text-[var(--color-text-primary)] hover:text-indigo-400 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {notif.sender?.name}
                      </Link>{' '}
                      {notif.type === 'like' && 'liked your post'}
                      {notif.type === 'comment' && 'commented on your post'}
                      {notif.type === 'follow' && 'started following you'}
                      {notif.type === 'reply' && 'replied to your comment'}
                      {notif.post && (
                        <>
                          {' — '}
                          <Link
                            to={`/posts/${notif.post._id}`}
                            className="text-indigo-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {notif.post.title}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Unread dot + delete */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notif.isRead && (
                      <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotif(notif._id); }}
                      className="text-[var(--color-text-muted)] hover:text-red-400 transition-colors p-1 rounded opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;

import { Bell, Cake, Calendar, MessageCircle, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: string;
  type: 'birthday' | 'event' | 'message' | 'access_request';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

export function NotificationCenter({
  notifications,
  onClose,
  onMarkRead,
  onClearAll
}: NotificationCenterProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'birthday':
        return <Cake className="w-5 h-5" />;
      case 'event':
        return <Calendar className="w-5 h-5" />;
      case 'message':
        return <MessageCircle className="w-5 h-5" />;
      case 'access_request':
        return <UserPlus className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'birthday':
        return 'var(--warm-rose)';
      case 'event':
        return 'var(--warm-mint)';
      case 'message':
        return 'var(--warm-sky)';
      case 'access_request':
        return 'var(--warm-coral)';
      default:
        return 'var(--muted-foreground)';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Notifications</h2>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[calc(80vh-64px)]">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={() => onMarkRead(notification.id)}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${getColor(notification.type)}30` }}
                    >
                      <div style={{ color: getColor(notification.type) }}>
                        {getIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-medium text-sm">{notification.title}</h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

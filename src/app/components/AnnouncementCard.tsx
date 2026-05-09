import { Megaphone, Pin } from 'lucide-react';
import { motion } from 'motion/react';

interface AnnouncementCardProps {
  title: string;
  message: string;
  author: string;
  timestamp: string;
  isPinned?: boolean;
}

export function AnnouncementCard({
  title,
  message,
  author,
  timestamp,
  isPinned = false
}: AnnouncementCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`bg-card rounded-2xl p-4 shadow-sm border-2 ${
        isPinned ? 'border-primary' : 'border-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isPinned ? 'bg-primary/20' : 'bg-muted'
        }`}>
          {isPinned ? (
            <Pin className="w-5 h-5 text-primary" />
          ) : (
            <Megaphone className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold">{title}</h4>
            {isPinned && (
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                Pinned
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{message}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{author}</span>
            <span>•</span>
            <span>{timestamp}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

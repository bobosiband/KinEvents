import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface KinEventCardProps {
  title: string;
  date: string;
  time: string;
  location?: string;
  attendeeCount: number;
  coverColor: string;
  rsvpStatus?: 'going' | 'maybe' | 'not-going';
}

export function KinEventCard({
  title,
  date,
  time,
  location,
  attendeeCount,
  coverColor,
  rsvpStatus
}: KinEventCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="bg-card rounded-2xl shadow-md overflow-hidden cursor-pointer"
    >
      <div
        className="h-24 relative"
        style={{ background: `linear-gradient(135deg, ${coverColor}dd, ${coverColor}99)` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Calendar className="w-12 h-12 text-white/20" />
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-3">{title}</h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{new Date(date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{time}</span>
          </div>

          {location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{attendeeCount} family members attending</span>
          </div>
        </div>

        {rsvpStatus && (
          <div className="pt-3 border-t border-border">
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              rsvpStatus === 'going'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : rsvpStatus === 'maybe'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {rsvpStatus === 'going' ? '✓ You\'re going' : rsvpStatus === 'maybe' ? '? Maybe' : '✗ Can\'t make it'}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

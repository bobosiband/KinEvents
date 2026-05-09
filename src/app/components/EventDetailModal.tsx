import { X, Calendar, Clock, MapPin, Users, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { FamilyAvatarGroup } from './FamilyAvatarGroup';

interface EventDetailModalProps {
  event: {
    id: string;
    title: string;
    date: string;
    time: string;
    location?: string;
    description?: string;
    attendees: Array<{ name: string; avatar: string; color: string }>;
    coverColor: string;
    rsvpStatus?: 'going' | 'maybe' | 'not-going';
  };
  onClose: () => void;
  onRSVP: (status: 'going' | 'maybe' | 'not-going') => void;
}

export function EventDetailModal({ event, onClose, onRSVP }: EventDetailModalProps) {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([
    { id: '1', author: 'Mom', avatar: 'M', color: '#ff6b6b', text: 'Can\'t wait! I\'ll bring the appetizers.', time: '2 hours ago' },
    { id: '2', author: 'Dad', avatar: 'D', color: '#4ecdc4', text: 'Should we set up the grill early?', time: '1 hour ago' },
  ]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      setComments([...comments, {
        id: Date.now().toString(),
        author: 'You',
        avatar: 'Y',
        color: '#d4a5ff',
        text: comment,
        time: 'Just now'
      }]);
      setComment('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Cover Image */}
        <div
          className="h-40 relative"
          style={{ background: `linear-gradient(135deg, ${event.coverColor}dd, ${event.coverColor}99)` }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-160px)] p-6">
          {/* Event Title */}
          <h1 className="text-3xl font-bold mb-4">{event.title}</h1>

          {/* Event Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{event.time}</p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <FamilyAvatarGroup members={event.attendees} maxDisplay={5} />
                <span className="text-sm text-muted-foreground">
                  {event.attendees.length} attending
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">About this event</h3>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
          )}

          {/* RSVP Buttons */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Will you be there?</h3>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onRSVP('going')}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  event.rsvpStatus === 'going'
                    ? 'bg-green-500 text-white'
                    : 'bg-muted hover:bg-green-100 dark:hover:bg-green-900/30'
                }`}
              >
                ✓ Going
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onRSVP('maybe')}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  event.rsvpStatus === 'maybe'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-muted hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                }`}
              >
                ? Maybe
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onRSVP('not-going')}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  event.rsvpStatus === 'not-going'
                    ? 'bg-gray-500 text-white'
                    : 'bg-muted hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                ✗ Can't go
              </motion.button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t border-border pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Event Discussion
            </h3>

            <div className="space-y-3 mb-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{c.author}</span>
                      <span className="text-xs text-muted-foreground">{c.time}</span>
                    </div>
                    <p className="text-sm">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

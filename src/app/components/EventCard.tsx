import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface EventCardProps {
  title: string;
  date: string;
  time: string;
  location?: string;
  attendees?: string[];
  color: string;
  onClick: () => void;
}

export function EventCard({ title, date, time, location, attendees, color, onClick }: EventCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-4 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow"
      style={{ backgroundColor: color }}
    >
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="space-y-1 text-sm opacity-90">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{time}</span>
        </div>
        {location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
        )}
        {attendees && attendees.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{attendees.join(', ')}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

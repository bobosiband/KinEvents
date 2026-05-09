import { Cake, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface BirthdayCardProps {
  name: string;
  date: string;
  age: number;
  avatar: string;
  color: string;
}

export function BirthdayCard({ name, date, age, avatar, color }: BirthdayCardProps) {
  const [daysUntil, setDaysUntil] = useState(0);

  useEffect(() => {
    const today = new Date();
    const birthday = new Date(date);
    const currentYear = today.getFullYear();
    const nextBirthday = new Date(currentYear, birthday.getMonth(), birthday.getDate());

    if (nextBirthday < today) {
      nextBirthday.setFullYear(currentYear + 1);
    }

    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysUntil(diffDays);
  }, [date]);

  const isToday = daysUntil === 0;
  const isSoon = daysUntil <= 7 && daysUntil > 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-2xl shadow-lg cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${color}ee, ${color}dd)`
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <Cake className="w-full h-full" />
      </div>

      <div className="relative p-5">
        <div className="flex items-center gap-4 mb-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold text-white shadow-md"
            style={{ backgroundColor: color }}
          >
            {avatar}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-white">{name}</h3>
            <p className="text-sm text-white/90">Turning {age}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/95">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {isToday && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full"
            >
              <span className="text-sm font-semibold text-white">🎉 Today!</span>
            </motion.div>
          )}

          {isSoon && !isToday && (
            <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="text-sm font-medium text-white">{daysUntil} days</span>
            </div>
          )}

          {!isToday && !isSoon && (
            <div className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full">
              <span className="text-sm text-white/90">{daysUntil} days</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

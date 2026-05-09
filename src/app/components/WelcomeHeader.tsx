import { Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface WelcomeHeaderProps {
  userName: string;
  greeting?: string;
}

export function WelcomeHeader({ userName, greeting }: WelcomeHeaderProps) {
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayGreeting = greeting || getTimeBasedGreeting();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-2xl font-semibold">{displayGreeting},</h1>
        <motion.div
          animate={{ rotate: [0, 10, 0, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
        >
          <Heart className="w-6 h-6 text-primary fill-primary" />
        </motion.div>
      </div>
      <p className="text-3xl font-bold bg-gradient-to-r from-[var(--warm-coral)] to-[var(--warm-rose)] bg-clip-text text-transparent">
        {userName}
      </p>
    </motion.div>
  );
}

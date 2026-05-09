import { Plus, CalendarPlus, Cake, MessageSquarePlus } from 'lucide-react';
import { motion } from 'motion/react';

interface QuickAction {
  icon: any;
  label: string;
  color: string;
  onClick: () => void;
}

export function QuickActions() {
  const actions: QuickAction[] = [
    {
      icon: CalendarPlus,
      label: 'New Event',
      color: 'var(--warm-mint)',
      onClick: () => console.log('New Event')
    },
    {
      icon: Cake,
      label: 'Add Birthday',
      color: 'var(--warm-rose)',
      onClick: () => console.log('Add Birthday')
    },
    {
      icon: MessageSquarePlus,
      label: 'Send Message',
      color: 'var(--warm-sky)',
      onClick: () => console.log('Send Message')
    },
    {
      icon: Plus,
      label: 'Quick Add',
      color: 'var(--warm-lavender)',
      onClick: () => console.log('Quick Add')
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className="bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${action.color}30` }}
            >
              <Icon className="w-6 h-6" style={{ color: action.color }} />
            </div>
            <span className="text-sm font-medium text-center">{action.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

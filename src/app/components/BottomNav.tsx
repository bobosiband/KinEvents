import { Home, Calendar, Cake, Users, MessageCircle, Bell } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
  notificationCount?: number;
}

const navItems = [
  { icon: Home, label: 'Home', value: 0 },
  { icon: Calendar, label: 'Events', value: 1 },
  { icon: Cake, label: 'Birthdays', value: 2 },
  { icon: Users, label: 'Family', value: 3 },
  { icon: MessageCircle, label: 'Messages', value: 4 },
];

export function BottomNav({ activeTab, onTabChange, notificationCount = 0 }: BottomNavProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border fixed left-0 top-0 bottom-0 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--warm-coral)] to-[var(--warm-rose)] bg-clip-text text-transparent">
            KinEvents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Family moments together</p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;
            return (
              <motion.button
                key={item.value}
                onClick={() => onTabChange(item.value)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.value === 4 && notificationCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-secondary text-secondary-foreground rounded-full text-xs flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-border">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors">
            <Bell className="w-5 h-5" />
            <span className="font-medium">Notifications</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;
            return (
              <motion.button
                key={item.value}
                onClick={() => onTabChange(item.value)}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl min-w-0 relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                <div className="relative">
                  <Icon
                    className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  {item.value === 4 && notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary text-xs flex items-center justify-center rounded-full text-secondary-foreground font-semibold">
                      {notificationCount}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </>
  );
}

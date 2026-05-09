import { X, User, Bell, Shield, Moon, LogOut, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsModalProps {
  onClose: () => void;
  onLogout?: () => void;
}

export function SettingsModal({ onClose, onLogout }: SettingsModalProps) {
  const settingSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Edit Profile', onClick: () => console.log('Edit profile') },
        { icon: Shield, label: 'Privacy & Security', onClick: () => console.log('Privacy') },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notification Settings', onClick: () => console.log('Notifications') },
        { icon: Moon, label: 'Appearance', onClick: () => console.log('Appearance') },
      ]
    }
  ];

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
        className="bg-card rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {/* Profile Section */}
          <div className="mb-6">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                S
              </div>
              <div>
                <h3 className="font-semibold text-lg">Sarah</h3>
                <p className="text-sm text-muted-foreground">sarah@family.com</p>
              </div>
            </div>
          </div>

          {/* Settings Sections */}
          {settingSections.map((section, index) => (
            <div key={section.title} className={index > 0 ? 'mt-6' : ''}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.label}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={item.onClick}
                      className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Logout Button */}
          {onLogout && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogout}
              className="w-full mt-8 p-4 bg-destructive/10 text-destructive rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

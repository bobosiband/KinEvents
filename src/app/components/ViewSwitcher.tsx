import { Code, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

type AppView = 'landing' | 'login' | 'admin-login' | 'access-request' | 'pending-approval' | 'main' | 'admin';

interface ViewSwitcherProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const views: { value: AppView; label: string; description: string }[] = [
    { value: 'landing', label: 'Landing Page', description: 'Hero, features, CTAs' },
    { value: 'login', label: 'User Login', description: 'Family member login' },
    { value: 'admin-login', label: 'Admin Login', description: 'Admin portal access' },
    { value: 'access-request', label: 'Request Access', description: 'New user onboarding' },
    { value: 'pending-approval', label: 'Pending Approval', description: 'Waiting state' },
    { value: 'main', label: 'Main Dashboard', description: 'Logged-in family view' },
    { value: 'admin', label: 'Admin Dashboard', description: 'Admin management' },
  ];

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-xl flex items-center justify-center lg:bottom-8 lg:right-8"
        title="View Switcher (Developer Tool)"
      >
        <Code className="w-6 h-6" />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-primary/5">
                <div>
                  <h2 className="text-lg font-bold">View Switcher</h2>
                  <p className="text-xs text-muted-foreground">Developer navigation tool</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* View List */}
              <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-4">
                <div className="space-y-2">
                  {views.map((view) => (
                    <motion.button
                      key={view.value}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onViewChange(view.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-4 rounded-xl transition-colors ${
                        currentView === view.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{view.label}</span>
                        {currentView === view.value && (
                          <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${
                        currentView === view.value
                          ? 'text-primary-foreground/80'
                          : 'text-muted-foreground'
                      }`}>
                        {view.description}
                      </p>
                    </motion.button>
                  ))}
                </div>

                {/* Info */}
                <div className="mt-4 p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground">
                    💡 Use this panel to quickly navigate between all views in the KinEvents design system.
                    Remove the <code className="px-1 py-0.5 bg-background rounded text-primary">ViewSwitcher</code> component in production.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

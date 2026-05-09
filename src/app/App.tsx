import { useState } from 'react';
import { Settings, Moon, Sun, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { BottomNav } from './components/BottomNav';
import { WelcomeHeader } from './components/WelcomeHeader';
import { QuickActions } from './components/QuickActions';
import { BirthdayCard } from './components/BirthdayCard';
import { KinEventCard } from './components/KinEventCard';
import { AnnouncementCard } from './components/AnnouncementCard';
import { FamilyAvatarGroup } from './components/FamilyAvatarGroup';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { AccessRequestPage } from './components/AccessRequestPage';
import { PendingApprovalPage } from './components/PendingApprovalPage';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationCenter } from './components/NotificationCenter';
import { EventDetailModal } from './components/EventDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { ViewSwitcher } from './components/ViewSwitcher';

type AppView = 'landing' | 'login' | 'admin-login' | 'access-request' | 'pending-approval' | 'main' | 'admin';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [activeTab, setActiveTab] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [pendingEmail, setPendingEmail] = useState('');

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const upcomingBirthdays = [
    { name: 'Sarah', date: '2026-05-15', age: 32, avatar: 'S', color: '#ff6b6b' },
    { name: 'Lucas', date: '2026-05-22', age: 8, avatar: 'L', color: '#4ecdc4' },
    { name: 'Grandma Rose', date: '2026-06-03', age: 75, avatar: 'R', color: '#ffd93d' },
  ];

  const [events, setEvents] = useState([
    {
      id: '1',
      title: 'Family BBQ & Pool Party',
      date: '2026-05-12',
      time: '2:00 PM',
      location: 'Our Backyard',
      description: 'Annual summer kickoff! Bring your swimsuit and appetite. We\'ll have the grill going all afternoon.',
      attendeeCount: 15,
      coverColor: '#a8e6cf',
      rsvpStatus: 'going' as const,
      attendees: [
        { name: 'Sarah', avatar: 'S', color: '#ff6b6b' },
        { name: 'John', avatar: 'J', color: '#4ecdc4' },
        { name: 'Emma', avatar: 'E', color: '#d4a5ff' },
        { name: 'Lucas', avatar: 'L', color: '#ffd93d' },
      ]
    },
    {
      id: '2',
      title: 'Movie Night - Frozen 3',
      date: '2026-05-18',
      time: '7:00 PM',
      location: 'Living Room',
      description: 'Family movie night with popcorn and cozy blankets!',
      attendeeCount: 8,
      coverColor: '#6eb5ff',
      rsvpStatus: 'going' as const,
      attendees: [
        { name: 'Emma', avatar: 'E', color: '#d4a5ff' },
        { name: 'Lucas', avatar: 'L', color: '#ffd93d' },
      ]
    },
    {
      id: '3',
      title: 'Grandpa\'s Retirement Party',
      date: '2026-05-25',
      time: '4:00 PM',
      location: 'Community Center',
      description: 'Celebrating Grandpa\'s 40 years of hard work! Let\'s make it special.',
      attendeeCount: 20,
      coverColor: '#ffd93d',
      rsvpStatus: 'maybe' as const,
      attendees: [
        { name: 'Sarah', avatar: 'S', color: '#ff6b6b' },
        { name: 'John', avatar: 'J', color: '#4ecdc4' },
        { name: 'Grandma', avatar: 'G', color: '#ff9a9e' },
      ]
    },
  ]);

  const familyMembers = [
    { name: 'Sarah', avatar: 'S', color: '#ff6b6b' },
    { name: 'John', avatar: 'J', color: '#4ecdc4' },
    { name: 'Emma', avatar: 'E', color: '#d4a5ff' },
    { name: 'Lucas', avatar: 'L', color: '#ffd93d' },
    { name: 'Grandma', avatar: 'G', color: '#ff9a9e' },
    { name: 'Grandpa', avatar: 'G', color: '#6eb5ff' },
    { name: 'Aunt Lisa', avatar: 'L', color: '#a8e6cf' },
    { name: 'Uncle Mike', avatar: 'M', color: '#ffa07a' },
  ];

  const announcements = [
    {
      title: 'Summer Vacation Planning',
      message: 'Let\'s start thinking about our annual summer trip! Drop your ideas in the family chat.',
      author: 'Dad',
      timestamp: '2 hours ago',
      isPinned: true
    },
    {
      title: 'New Family Photos',
      message: 'Mom uploaded the photos from last weekend\'s picnic. Check them out in the gallery!',
      author: 'Mom',
      timestamp: '1 day ago',
      isPinned: false
    },
  ];

  const [accessRequests, setAccessRequests] = useState([
    {
      id: '1',
      name: 'Michael Chen',
      relationship: 'Cousin',
      email: 'michael.chen@email.com',
      reason: 'Hi! I\'m Sarah\'s cousin from the west coast. Would love to stay connected with family events.',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      name: 'Jennifer Williams',
      relationship: 'Friend of the family',
      email: 'jen.williams@email.com',
      reason: 'I\'ve known the family for 10+ years and would love to be part of celebrations.',
      timestamp: '1 day ago'
    }
  ]);

  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'birthday' as const,
      title: 'Birthday Reminder',
      message: 'Sarah\'s birthday is in 7 days! Don\'t forget to wish her.',
      timestamp: '2 hours ago',
      read: false
    },
    {
      id: '2',
      type: 'event' as const,
      title: 'Event Tomorrow',
      message: 'Family BBQ & Pool Party is tomorrow at 2:00 PM',
      timestamp: '5 hours ago',
      read: false
    },
    {
      id: '3',
      type: 'message' as const,
      title: 'New Message from Dad',
      message: 'Who\'s bringing dessert to the BBQ?',
      timestamp: '1 day ago',
      read: true
    },
  ]);

  const handleLogin = (email: string, password: string, remember: boolean) => {
    toast.success('Welcome back to KinEvents!');
    setView('main');
  };

  const handleAccessRequest = (data: any) => {
    setPendingEmail(data.email);
    toast.success('Request submitted! We\'ll review it soon.');
    setView('pending-approval');
  };

  const handleApproveRequest = (id: string) => {
    setAccessRequests(accessRequests.filter(r => r.id !== id));
    toast.success('Access approved! Credentials sent to user.');
  };

  const handleDenyRequest = (id: string) => {
    setAccessRequests(accessRequests.filter(r => r.id !== id));
    toast.info('Request denied.');
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
  };

  const handleRSVP = (status: 'going' | 'maybe' | 'not-going') => {
    if (selectedEvent) {
      setEvents(events.map(e =>
        e.id === selectedEvent.id ? { ...e, rsvpStatus: status } : e
      ));
      setSelectedEvent({ ...selectedEvent, rsvpStatus: status });
      toast.success(`RSVP updated to: ${status === 'going' ? 'Going' : status === 'maybe' ? 'Maybe' : 'Can\'t make it'}`);
    }
  };

  // Landing/Auth Views
  if (view === 'landing') {
    return (
      <>
        <Toaster position="top-center" richColors />
        <ViewSwitcher currentView={view} onViewChange={setView} />
        <LandingPage
          onRequestAccess={() => setView('access-request')}
          onLogin={() => setView('login')}
        />
      </>
    );
  }

  if (view === 'login') {
    return (
      <>
        <Toaster position="top-center" richColors />
        <ViewSwitcher currentView={view} onViewChange={setView} />
        <LoginPage
          onLogin={handleLogin}
          onBack={() => setView('landing')}
        />
      </>
    );
  }

  if (view === 'admin-login') {
    return (
      <>
        <Toaster position="top-center" richColors />
        <ViewSwitcher currentView={view} onViewChange={setView} />
        <LoginPage
          onLogin={(email, password, remember) => {
            toast.success('Admin login successful');
            setView('admin');
          }}
          onBack={() => setView('landing')}
          isAdmin
        />
      </>
    );
  }

  if (view === 'access-request') {
    return (
      <>
        <Toaster position="top-center" richColors />
        <ViewSwitcher currentView={view} onViewChange={setView} />
        <AccessRequestPage
          onSubmit={handleAccessRequest}
          onBack={() => setView('landing')}
        />
      </>
    );
  }

  if (view === 'pending-approval') {
    return (
      <>
        <Toaster position="top-center" richColors />
        <ViewSwitcher currentView={view} onViewChange={setView} />
        <PendingApprovalPage
          email={pendingEmail}
          onBack={() => setView('landing')}
        />
      </>
    );
  }

  // Admin View
  if (view === 'admin') {
    return (
      <>
        <Toaster position="top-center" richColors />
        <ViewSwitcher currentView={view} onViewChange={setView} />
        <AdminDashboard
          requests={accessRequests}
          onApprove={handleApproveRequest}
          onDeny={handleDenyRequest}
        />
      </>
    );
  }

  // Main App View
  return (
    <>
      <Toaster position="top-center" richColors />
      <ViewSwitcher currentView={view} onViewChange={setView} />
      <div className="min-h-screen bg-background transition-colors duration-300">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} notificationCount={notifications.filter(n => !n.read).length} />

      <div className="lg:ml-64">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-24 lg:pb-8">
          {/* Header with Settings */}
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div className="lg:hidden">
              <h1 className="text-xl font-bold bg-gradient-to-r from-[var(--warm-coral)] to-[var(--warm-rose)] bg-clip-text text-transparent">
                KinEvents
              </h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNotifications(true)}
                className="relative w-10 h-10 rounded-xl bg-card shadow-sm flex items-center justify-center hover:shadow-md transition-shadow"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl bg-card shadow-sm flex items-center justify-center hover:shadow-md transition-shadow"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 rounded-xl bg-card shadow-sm flex items-center justify-center hover:shadow-md transition-shadow"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Home Tab */}
            {activeTab === 0 && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <WelcomeHeader userName="Sarah" />
                <QuickActions />

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Family Updates</h2>
                  <div className="space-y-3">
                    {announcements.map((announcement, index) => (
                      <AnnouncementCard key={index} {...announcement} />
                    ))}
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Upcoming Birthdays 🎂</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingBirthdays.map((birthday) => (
                      <BirthdayCard key={birthday.name} {...birthday} />
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.slice(0, 2).map((event) => (
                      <div key={event.id} onClick={() => handleEventClick(event)}>
                        <KinEventCard {...event} />
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {/* Events Tab */}
            {activeTab === 1 && (
              <motion.div
                key="events"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-2xl font-bold mb-6">Family Events</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((event) => (
                    <div key={event.id} onClick={() => handleEventClick(event)}>
                      <KinEventCard {...event} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Birthdays Tab */}
            {activeTab === 2 && (
              <motion.div
                key="birthdays"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-2xl font-bold mb-6">Family Birthdays</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingBirthdays.map((birthday) => (
                    <BirthdayCard key={birthday.name} {...birthday} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Family Tab */}
            {activeTab === 3 && (
              <motion.div
                key="family"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-2xl font-bold mb-6">Our Family</h1>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {familyMembers.map((member, index) => (
                    <motion.div
                      key={member.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div
                        className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white shadow-md"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.avatar}
                      </div>
                      <p className="text-center font-medium">{member.name}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages Tab */}
            {activeTab === 4 && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-2xl font-bold mb-6">Family Chat</h1>

                <div className="bg-card rounded-2xl shadow-sm p-4 mb-4">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                    <FamilyAvatarGroup members={familyMembers} maxDisplay={6} />
                    <div>
                      <h3 className="font-semibold">Family Group</h3>
                      <p className="text-sm text-muted-foreground">{familyMembers.length} members</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: '#4ecdc4' }}
                      >
                        J
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">John</span>
                          <span className="text-xs text-muted-foreground">10:30 AM</span>
                        </div>
                        <div className="bg-muted rounded-2xl rounded-tl-sm p-3">
                          <p className="text-sm">Who's bringing dessert to the BBQ on Saturday? 🍰</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: '#ff9a9e' }}
                      >
                        G
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">Grandma</span>
                          <span className="text-xs text-muted-foreground">10:35 AM</span>
                        </div>
                        <div className="bg-muted rounded-2xl rounded-tl-sm p-3">
                          <p className="text-sm">I'll make my famous apple pie! ❤️</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 flex-row-reverse">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: '#ff6b6b' }}
                      >
                        S
                      </div>
                      <div className="flex-1 flex flex-col items-end">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">10:40 AM</span>
                          <span className="font-medium text-sm">You</span>
                        </div>
                        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm p-3 max-w-[80%]">
                          <p className="text-sm">Perfect! I'll bring ice cream to go with it 🍦</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                      >
                        Send
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Notification Center */}
      <AnimatePresence>
        {showNotifications && (
          <NotificationCenter
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
            onMarkRead={(id) => {
              setNotifications(notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
              ));
            }}
            onClearAll={() => setNotifications([])}
          />
        )}
      </AnimatePresence>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onRSVP={handleRSVP}
          />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            onLogout={() => {
              setShowSettings(false);
              setView('landing');
              toast.info('Signed out successfully');
            }}
          />
        )}
      </AnimatePresence>
      </div>
    </>
  );
}

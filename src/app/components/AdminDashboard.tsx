import { Shield, UserPlus, Users, Calendar, Bell, Settings, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface AccessRequest {
  id: string;
  name: string;
  relationship: string;
  email: string;
  reason: string;
  timestamp: string;
}

interface AdminDashboardProps {
  requests: AccessRequest[];
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}

export function AdminDashboard({ requests, onApprove, onDeny }: AdminDashboardProps) {
  const stats = [
    { label: 'Family Members', value: '20', icon: Users, color: 'var(--warm-sky)' },
    { label: 'Pending Requests', value: requests.length.toString(), icon: UserPlus, color: 'var(--warm-coral)' },
    { label: 'Upcoming Events', value: '5', icon: Calendar, color: 'var(--warm-mint)' },
    { label: 'Active Today', value: '12', icon: Activity, color: 'var(--warm-lavender)' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage your family's KinEvents</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 bg-card rounded-xl flex items-center justify-center hover:bg-muted">
                <Bell className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-card rounded-xl flex items-center justify-center hover:bg-muted">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-5 shadow-sm"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${stat.color}30` }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Pending Access Requests */}
        <div className="bg-card rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Pending Access Requests
          </h2>

          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-muted rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{request.name}</h3>
                        <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium">
                          {request.relationship}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{request.email}</p>
                      <p className="text-sm mb-3">{request.reason}</p>
                      <p className="text-xs text-muted-foreground">{request.timestamp}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onApprove(request.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium text-sm hover:bg-green-600"
                      >
                        Approve
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onDeny(request.id)}
                        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium text-sm hover:opacity-90"
                      >
                        Deny
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { motion } from 'motion/react'
import { Shield, UserPlus, Users, Calendar, Activity } from 'lucide-react'
import { useAdminDashboard } from '@/admin/hooks/useAdmin'
import { useAccessRequests, useApproveAccess, useRevokeAccess } from '@/features/auth/hooks/useRequestAccess'
import { Loader } from '@/components/feedback/Loader'
import toast from 'react-hot-toast'

export function AdminHome() {
  const { data, isLoading } = useAdminDashboard()
  const accessRequests = useAccessRequests()
  const approve = useApproveAccess()
  const revoke = useRevokeAccess()

  const pendingRequests = (accessRequests.data ?? []).filter(r => r.status === 'pending')

  const stats = [
    { label: 'Family Members', value: data?.users.approved ?? 0, icon: Users, color: 'var(--warm-sky)' },
    { label: 'Pending Requests', value: data?.accessRequests.pending ?? 0, icon: UserPlus, color: 'var(--warm-coral)' },
    { label: 'Total Events', value: data?.events.total ?? 0, icon: Calendar, color: 'var(--warm-mint)' },
    { label: 'Total Users', value: data?.users.total ?? 0, icon: Activity, color: 'var(--warm-lavender)' },
  ]

  if (isLoading) return <Loader />

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your family's KinEvents</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-card rounded-2xl p-5 shadow-sm"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${stat.color}30` }}>
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <p className="text-3xl font-bold mb-0.5">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          )
        })}
      </div>

      <div className="bg-card rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Pending Access Requests
          {pendingRequests.length > 0 && (
            <span className="ml-auto text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full font-medium">
              {pendingRequests.length} pending
            </span>
          )}
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-muted rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold">{request.name}</h3>
                      <span className="text-xs px-2 py-0.5 bg-primary/15 text-primary rounded-full font-medium">
                        {request.email}
                      </span>
                    </div>
                    {request.message && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{request.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => approve.mutate(request.id, {
                        onSuccess: () => toast.success(`${request.name} approved!`),
                        onError: (err: any) => toast.error(err?.message ?? 'Failed to approve'),
                      })}
                      disabled={approve.isPending}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium text-sm hover:bg-green-600 transition-colors disabled:opacity-60"
                    >
                      Approve
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => revoke.mutate(request.id, {
                        onSuccess: () => toast.success('Request denied'),
                        onError: (err: any) => toast.error(err?.message ?? 'Failed to deny'),
                      })}
                      disabled={revoke.isPending}
                      className="px-4 py-2 bg-muted-foreground/20 text-foreground rounded-lg font-medium text-sm hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-60"
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
  )
}

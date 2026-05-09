import { Heart, Clock, Mail, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface PendingApprovalPageProps {
  email: string;
  onBack: () => void;
}

export function PendingApprovalPage({ email, onBack }: PendingApprovalPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] via-[#fff9f0] to-[#f0f9ff] dark:from-[#1a1a1a] dark:via-[#1f1a1a] dark:to-[#1a1f24] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-3xl shadow-xl p-8 text-center">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-[var(--warm-mint)] to-[var(--warm-sky)] rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>

          <Heart className="w-8 h-8 text-primary fill-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Request Submitted!</h1>
          <p className="text-muted-foreground mb-8">
            Your access request has been sent to the family admin for review.
          </p>

          {/* Status Cards */}
          <div className="space-y-3 mb-8">
            <div className="bg-muted rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Pending Review</p>
                <p className="text-xs text-muted-foreground">Usually takes 1-2 days</p>
              </div>
            </div>

            <div className="bg-muted rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-sm">Check Your Email</p>
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl mb-6">
            <p className="text-sm">
              You'll receive login credentials via email once your request is approved by a family admin.
            </p>
          </div>

          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to home
          </button>
        </div>
      </motion.div>
    </div>
  );
}

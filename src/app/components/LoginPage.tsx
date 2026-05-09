import { Heart, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface LoginPageProps {
  onLogin: (email: string, password: string, remember: boolean) => void;
  onBack: () => void;
  isAdmin?: boolean;
}

export function LoginPage({ onLogin, onBack, isAdmin = false }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password, remember);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] via-[#fff9f0] to-[#f0f9ff] dark:from-[#1a1a1a] dark:via-[#1f1a1a] dark:to-[#1a1f24] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-3xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="inline-flex items-center gap-2 mb-4"
            >
              <Heart className="w-10 h-10 text-primary fill-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--warm-coral)] to-[var(--warm-rose)] bg-clip-text text-transparent">
                KinEvents
              </h1>
            </motion.div>
            <h2 className="text-2xl font-semibold mb-2">
              {isAdmin ? 'Admin Login' : 'Welcome Back'}
            </h2>
            <p className="text-muted-foreground">
              {isAdmin ? 'Secure admin access' : 'Sign in to see what your family is up to'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email or Username</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={isAdmin ? 'admin@kinevents.com' : 'you@family.com'}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-primary text-primary focus:ring-primary"
                />
                <span className="text-sm">Remember me</span>
              </label>
              <button type="button" className="text-sm text-primary hover:underline">
                Forgot password?
              </button>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              Sign In
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to home
            </button>
          </div>

          {isAdmin && (
            <div className="mt-4 p-3 bg-primary/10 rounded-xl text-center">
              <p className="text-xs text-primary font-medium">Admin Access Only</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

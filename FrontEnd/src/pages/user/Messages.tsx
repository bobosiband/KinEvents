import { motion } from 'motion/react'
import { MessageCircle } from 'lucide-react'

export function Messages() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-[var(--warm-sky)]/20 flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8" style={{ color: 'var(--warm-sky)' }} />
        </div>
        <h2 className="text-xl font-semibold mb-2">Family Messages</h2>
        <p className="text-muted-foreground max-w-sm">
          Stay connected with your family. Messages and group chat are coming soon.
        </p>
      </motion.div>
    </div>
  )
}

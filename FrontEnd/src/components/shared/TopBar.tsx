import { Menu } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'

interface TopBarProps {
  onOpenMenu: () => void
  userName?: string
}

export function TopBar({ onOpenMenu, userName }: TopBarProps) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
      <button
        onClick={onOpenMenu}
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
        className="text-lg font-bold bg-gradient-to-r from-[var(--warm-coral)] to-[var(--warm-rose)] bg-clip-text text-transparent"
      >
        KinEvents
      </motion.div>
      <Link to="/profile" className="w-9 h-9 flex items-center justify-center">
        <Avatar name={userName} size="sm" />
      </Link>
    </header>
  )
}

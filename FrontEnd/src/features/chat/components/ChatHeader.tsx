import { Avatar } from '@/components/ui/Avatar'
import type { User } from '@/features/users/types/user.types'

interface ChatHeaderProps {
  members: User[]
}

function AvatarRow({ members, maxDisplay }: { members: User[]; maxDisplay: number }) {
  const visibleMembers = members.slice(0, maxDisplay)
  const overflow = Math.max(members.length - maxDisplay, 0)

  return (
    <div className="flex items-center -space-x-2">
      {visibleMembers.map((member) => (
        <div key={member.id} className="ring-2 ring-card rounded-full">
          <Avatar name={member.name} size="sm" />
        </div>
      ))}
      {overflow > 0 ? (
        <div className="w-8 h-8 rounded-full ring-2 ring-card bg-muted text-xs font-semibold text-muted-foreground inline-flex items-center justify-center">
          +{overflow}
        </div>
      ) : null}
    </div>
  )
}

export function ChatHeader({ members }: ChatHeaderProps) {
  return (
    <div className="border-b border-border border-t-[3px] border-t-[var(--warm-coral)] bg-card px-4 py-3 space-y-2">
      <div className="lg:hidden">
        <AvatarRow members={members} maxDisplay={5} />
      </div>
      <div className="hidden lg:block">
        <AvatarRow members={members} maxDisplay={6} />
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">Family Group</p>
        <p className="text-xs text-muted-foreground">{members.length} members</p>
      </div>
    </div>
  )
}

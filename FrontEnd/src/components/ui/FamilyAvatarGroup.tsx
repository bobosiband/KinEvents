import { motion } from 'motion/react'

interface FamilyMember {
  name: string
  avatar: string
  color: string
}

interface FamilyAvatarGroupProps {
  members: FamilyMember[]
  maxDisplay?: number
}

export function FamilyAvatarGroup({ members, maxDisplay = 5 }: FamilyAvatarGroupProps) {
  const displayMembers = members.slice(0, maxDisplay)
  const remainingCount = members.length - maxDisplay

  return (
    <div className="flex items-center -space-x-2">
      {displayMembers.map((member, index) => (
        <motion.div
          key={member.name}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.2, zIndex: 10 }}
          className="w-10 h-10 rounded-full border-2 border-background flex items-center justify-center text-sm font-semibold text-white shadow-md cursor-pointer"
          style={{ backgroundColor: member.color }}
          title={member.name}
        >
          {member.avatar}
        </motion.div>
      ))}
      {remainingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: maxDisplay * 0.05 }}
          className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-semibold shadow-md"
        >
          +{remainingCount}
        </motion.div>
      )}
    </div>
  )
}

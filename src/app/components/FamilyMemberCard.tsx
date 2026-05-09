import { Avatar } from '@mui/material';
import { motion } from 'motion/react';

interface FamilyMemberCardProps {
  name: string;
  role: string;
  avatar: string;
  color: string;
}

export function FamilyMemberCard({ name, role, avatar, color }: FamilyMemberCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm"
    >
      <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
        {avatar}
      </Avatar>
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-500">{role}</p>
      </div>
    </motion.div>
  );
}

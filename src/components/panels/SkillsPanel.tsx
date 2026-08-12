'use client';
import { motion } from 'framer-motion';

const skills = [
  { name: 'Python', level: 90 },
  { name: 'Java', level: 75 },
  { name: 'JavaScript', level: 70 },
  { name: 'React', level: 65 },
  { name: 'SQL', level: 70 },
  { name: 'Git / GitHub', level: 85 }
];

export default function SkillsPanel() {
  return (
    <div className="flex flex-col gap-5 pt-2">
      {skills.map((skill, index) => (
        <div key={skill.name} className="flex items-center gap-4">
          <div className="w-24 font-mono text-xs text-text-primary shrink-0">
            {skill.name}
          </div>
          
          <div className="flex-1 h-[2px] bg-white/10 relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${skill.level}%` }}
              transition={{ duration: 1, delay: 0.1 * index, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full bg-[#4a9f5d]"
            />
          </div>

          <div className="w-8 text-right font-mono text-xs text-text-muted shrink-0">
            {skill.level}%
          </div>
        </div>
      ))}
    </div>
  );
}

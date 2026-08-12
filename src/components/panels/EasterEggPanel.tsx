'use client';

import { 
  Gamepad2, 
  Film, 
  Coffee, 
  BookOpen, 
  Camera, 
  Plane
} from 'lucide-react';

const hobbies = [
  { name: 'Playing Chess', icon: Gamepad2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { name: 'Watching Movies', icon: Film, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { name: 'Brewing Coffee', icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { name: 'Reading Tech Blogs', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'Photography', icon: Camera, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { name: 'Traveling', icon: Plane, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
];

export default function EasterEggPanel() {
  return (
    <div className="flex flex-col gap-6 pt-2">
      <p className="text-sm text-text-muted leading-relaxed font-sans">
        When I'm not writing code or building 3D experiences, here are a few things I love to do to unwind and recharge:
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        {hobbies.map((hobby, idx) => (
          <div 
            key={idx}
            className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-black/20 hover:bg-black/40 hover:border-white/10 transition-all group cursor-default"
          >
            <div className={`p-2 rounded-lg ${hobby.bg} ${hobby.color} transition-transform group-hover:scale-110`}>
              <hobby.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-sans text-text-primary group-hover:text-neon-green transition-colors">
              {hobby.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

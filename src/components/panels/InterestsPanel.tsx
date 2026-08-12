'use client';

const interests = [
  'UI/UX Design', '3D Web Experiences', 'Open Source', 'Hackathons',
  'Music Production', 'Poetry Writing', 'Creative Coding', 'Gaming'
];

export default function InterestsPanel() {
  return (
    <div className="flex flex-wrap gap-3">
      {interests.map((interest, i) => (
        <div 
          key={i} 
          className="px-4 py-2 bg-black/30 border border-white/10 rounded-full text-sm font-mono text-text-muted hover:text-neon-green hover:border-neon-green/30 transition-colors cursor-default"
        >
          {interest}
        </div>
      ))}
    </div>
  );
}

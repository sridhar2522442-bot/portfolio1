'use client';

import { motion } from 'framer-motion';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } }
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
};

const statItem = {
  hidden: { opacity: 0, y: 10, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } }
};

function Header() {
  return (
    <motion.div variants={item} className="flex items-center gap-6">
      {/* Avatar Image with animated gold ring glow */}
      <div className="relative shrink-0 w-16 h-16 rounded-full flex items-center justify-center">
        <motion.div
          animate={{ boxShadow: ['0 0 5px rgba(212,175,55,0.2)', '0 0 15px rgba(212,175,55,0.6)', '0 0 5px rgba(212,175,55,0.2)'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full border border-[#d4af37]/40"
        />
        <div className="w-[90%] h-[90%] rounded-full overflow-hidden">
          <img src="/avatar.jpeg" alt="S. Sridhar Avatar" className="w-full h-full object-cover" />
        </div>
      </div>
      
      <div className="flex flex-col gap-1">
        <h3 className="font-sans font-bold text-2xl text-white tracking-wide">S. Sridhar</h3>
        <p className="text-text-muted text-xs font-mono">IT Student | Developer | Builder</p>
      </div>
    </motion.div>
  );
}

function BioBlock() {
  return (
    <motion.div variants={item} className="text-white/70 font-sans leading-relaxed max-w-[85%] text-sm">
      <p>
        IT undergraduate at Mohamed Sathak A.J. College of Engineering, building full-stack products end to end — from AI-assisted debugging tools to production e-commerce platforms. I care about interfaces that feel considered, not templated.
      </p>
    </motion.div>
  );
}

function StatChips() {
  const stats = [
    '3rd Year · IT',
    '3+ Projects',
    'Chennai, IN',
    'Open to Internships'
  ];

  return (
    <motion.div variants={item} className="flex flex-wrap gap-2 md:gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          variants={statItem}
          className="rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-1.5 flex items-center justify-center"
        >
          <span className="text-[#d4af37] text-[10px] sm:text-xs font-medium uppercase tracking-wider">{stat}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function CurrentlyBuilding() {
  return (
    <motion.div variants={item} className="flex items-center gap-2">
      <motion.div 
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-2 h-2 rounded-full bg-[#d4af37] shrink-0"
      />
      <span className="text-white/80 text-sm">
        Currently exploring agentic dev tools and 3D web experiences.
      </span>
    </motion.div>
  );
}

function TechTags() {
  const tags = ['Next.js', 'TypeScript', 'MongoDB', 'Framer Motion', 'Three.js', 'Tailwind'];
  return (
    <motion.div variants={item} className="flex flex-wrap gap-2">
      {tags.map((tag, i) => (
        <div key={i} className="px-2 py-1 rounded text-[10px] font-mono text-white/60 border border-white/5 bg-black/20 hover:border-[#d4af37]/50 hover:text-[#d4af37] transition-colors cursor-default">
          {tag}
        </div>
      ))}
    </motion.div>
  );
}

function SignatureLine() {
  return (
    <motion.div variants={item} className="text-center pt-2">
      <p className="text-white/40 text-[11px] italic tracking-widest font-serif">
        "Learn → Code → Build → Repeat."
      </p>
    </motion.div>
  );
}

export default function AboutPanel() {
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      <Header />
      
      <BioBlock />
      
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent my-1" />
      
      <StatChips />
      
      <CurrentlyBuilding />
      
      <TechTags />

      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent mt-2" />
      
      <SignatureLine />
    </motion.div>
  );
}

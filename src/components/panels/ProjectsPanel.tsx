'use client';
import { FaGithub } from 'react-icons/fa6';
import { ExternalLink, Users, User, Database } from 'lucide-react';

const projects = [
  { icon: Users, title: 'Employee Payroll System', desc: 'Full-stack employee payroll management', github: '#', live: '#' },
  { icon: User, title: 'College AI Chatbot', desc: 'AI chatbot for college website', github: '#', live: '#' },
  { icon: Database, title: 'The Tea Hub', desc: 'Full-stack premium tea & coffee e-commerce', github: '#', live: '#' }
];

export default function ProjectsPanel() {
  return (
    <div className="flex flex-col gap-6 pt-2">
      {projects.map((proj, i) => (
        <div key={i} className="flex gap-4 group">
          <div className="mt-1 shrink-0">
            <proj.icon className="w-5 h-5 text-[#4a9f5d]" />
          </div>
          
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-start">
              <h3 className="text-white font-sans text-sm font-bold tracking-wide">{proj.title}</h3>
              <div className="flex gap-3 text-text-muted shrink-0 ml-4">
                <a href={proj.github} className="hover:text-white transition-colors"><FaGithub className="w-4 h-4" /></a>
                <a href={proj.live} className="hover:text-white transition-colors"><ExternalLink className="w-4 h-4" /></a>
              </div>
            </div>
            <p className="text-xs text-text-muted font-sans mt-1 leading-relaxed max-w-[90%]">{proj.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

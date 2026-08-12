'use client';
import { Mail } from 'lucide-react';
import { FaLinkedin, FaGithub, FaInstagram } from 'react-icons/fa6';

export default function ContactPanel() {
  return (
    <div className="flex flex-col h-full gap-8 pt-2">
      <div className="flex flex-col gap-6">
        {[
          { icon: Mail, label: 'sridhar2522442@gmail.com', href: 'mailto:sridhar2522442@gmail.com' },
          { icon: FaLinkedin, label: 'linkedin.com/in/sridhar-s', href: 'https://www.linkedin.com/in/sridhar-s-081527328/' },
          { icon: FaGithub, label: 'github.com/sridhar2522442-bot', href: 'https://github.com/sridhar2522442-bot' }
        ].map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 group"
          >
            <link.icon className="w-4 h-4 text-[#4a9f5d] shrink-0" />
            <span className="font-sans text-xs text-text-muted group-hover:text-white transition-colors">{link.label}</span>
          </a>
        ))}
      </div>

      <a 
        href="mailto:sridhar2522442@gmail.com"
        className="mt-2 w-fit px-6 py-2 bg-[#4a9f5d] text-white font-sans text-xs font-bold tracking-wider rounded-sm hover:bg-[#3d834c] transition-colors"
      >
        SEND MESSAGE
      </a>
    </div>
  );
}

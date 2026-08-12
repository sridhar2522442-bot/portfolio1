'use client';

export default function EducationPanel() {
  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm text-white font-sans tracking-wide">B.Tech Information Technology</h3>
        <p className="text-xs text-text-muted font-sans leading-relaxed">
          Mohamed Sathak A.J. College<br />
          of Engineering, Chennai
        </p>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <h3 className="text-sm text-white font-sans tracking-wide">3rd Year</h3>
        <div className="flex justify-between items-center text-xs text-text-muted font-sans">
          <span>2024 - 2028</span>
          {/* A small graduation cap icon placeholder on the right matching the design */}
          <svg className="w-5 h-5 text-[#4a9f5d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

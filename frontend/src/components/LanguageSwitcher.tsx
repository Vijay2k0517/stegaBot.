"use client";

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { LANGUAGES, Language } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === language);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full bg-slate-800/50 px-3 py-2 text-sm text-slate-300 ring-1 ring-slate-700/50 backdrop-blur-sm transition-all hover:bg-slate-700/50 hover:text-white"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLang?.nativeName}</span>
      </button>
      
      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-slate-700 bg-slate-800/95 py-2 shadow-xl backdrop-blur-sm z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as Language);
                setOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-slate-700/50 ${
                language === lang.code ? 'text-cyan-400' : 'text-slate-300'
              }`}
            >
              <span className="font-medium">{lang.nativeName}</span>
              <span className="ml-2 text-slate-500">({lang.name})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

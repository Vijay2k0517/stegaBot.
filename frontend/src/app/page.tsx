"use client";

import { motion } from "framer-motion";
import { Lock, Eye, ChevronRight, Sparkles, BarChart3, Share2, Zap } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Home() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-3xl" />
        <GridPattern />
      </div>

      <div className="relative z-10">
        <header className="container mx-auto px-6 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="logo-font text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent">StegaBot</span>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Link
                href="/chat"
                className="group flex items-center gap-2 rounded-full bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 ring-1 ring-slate-700/50 backdrop-blur-sm transition-all hover:bg-slate-700/50 hover:text-white"
              >
                {t('launchChat')}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </nav>
        </header>

        <main className="container mx-auto px-6 pt-16 pb-24">
          <div className="mx-auto max-w-4xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl font-bold tracking-tight sm:text-7xl"
            >
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {t('heroTitle1')}
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent">
                {t('heroTitle2')}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mt-8 max-w-2xl text-lg text-slate-400 leading-relaxed"
            >
              {t('heroDescription')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/chat"
                className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-cyan-500/30 transition-all hover:shadow-cyan-500/50 hover:scale-[1.02]"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="relative flex items-center gap-2">
                  {t('startChat')}
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
              <a
                href="#features"
                className="flex items-center gap-2 rounded-full px-6 py-4 text-slate-400 transition-colors hover:text-white"
              >
                {t('learnMore')}
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-24"
            id="features"
          >
            <div className="grid gap-6 md:grid-cols-3">
              <FeatureCard
                icon={<Lock className="h-6 w-6" />}
                title={t('feature1Title')}
                description={t('feature1Desc')}
                delay={0}
              />
              <FeatureCard
                icon={<Eye className="h-6 w-6" />}
                title={t('feature2Title')}
                description={t('feature2Desc')}
                delay={0.1}
              />
              <FeatureCard
                icon={<Sparkles className="h-6 w-6" />}
                title={t('feature3Title')}
                description={t('feature3Desc')}
                delay={0.2}
              />
              <FeatureCard
                icon={<BarChart3 className="h-6 w-6" />}
                title={t('feature4Title')}
                description={t('feature4Desc')}
                delay={0.3}
                href="/analyze"
              />
              <FeatureCard
                icon={<Share2 className="h-6 w-6" />}
                title={t('feature5Title')}
                description={t('feature5Desc')}
                delay={0.4}
              />
              <FeatureCard
                icon={<Zap className="h-6 w-6" />}
                title={t('feature6Title')}
                description={t('feature6Desc')}
                delay={0.5}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-24 rounded-3xl border border-slate-700/50 bg-slate-900/30 p-8 backdrop-blur-sm"
          >
            <h2 className="mb-8 text-center text-2xl font-semibold">
              {t('howItWorks')}
            </h2>
            <div className="grid gap-8 md:grid-cols-4">
              {[
                { step: "01", key: "step1" as const },
                { step: "02", key: "step2" as const },
                { step: "03", key: "step3" as const },
                { step: "04", key: "step4" as const },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold">
                    {item.step}
                  </div>
                  <p className="text-sm text-slate-400">{t(item.key)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </main>

        <footer className="border-t border-slate-800 py-8">
          <div className="container mx-auto px-6 text-center text-sm text-slate-500">
            {t('footer')}
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  href?: string;
}) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 + delay }}
      className="group rounded-2xl border border-slate-700/50 bg-slate-900/30 p-6 backdrop-blur-sm transition-all hover:border-cyan-500/30 hover:bg-slate-800/30 h-full"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 transition-colors group-hover:bg-cyan-500/20">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      {href && (
        <div className="mt-4 flex items-center gap-1 text-sm text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Try it <ChevronRight className="h-4 w-4" />
        </div>
      )}
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function GridPattern() {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.02]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="grid"
          width="60"
          height="60"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 60 0 L 0 0 0 60"
            fill="none"
            stroke="white"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

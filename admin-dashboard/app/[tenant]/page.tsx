"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Menu,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bus,
  Library,
  Trophy,
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1920&auto=format&fit=crop";

const FEATURES = [
  {
    icon: GraduationCap,
    title: "Qualified Educators",
    desc: "Mentored by passionate, expert teachers dedicated to academic growth.",
  },
  {
    icon: Sparkles,
    title: "Modern Classrooms",
    desc: "Smart digital learning suites for modern interactive education.",
  },
  {
    icon: ShieldCheck,
    title: "CBT Examinations",
    desc: "Advanced computer-based testing for instantaneous assessment.",
  },
  {
    icon: BookOpen,
    title: "Student Portal",
    desc: "Seamless access to homework, study materials, and grades.",
  },
  {
    icon: Users,
    title: "Parent Portal",
    desc: "Real-time performance metrics and direct teacher communication.",
  },
  {
    icon: Calendar,
    title: "Attendance Tracking",
    desc: "Automated real-time attendance alerts and accurate reporting.",
  },
  {
    icon: Trophy,
    title: "Result Management",
    desc: "Instant digital term report cards and analytical insight.",
  },
  {
    icon: Bus,
    title: "School Transport",
    desc: "Safe, trackable, and comfortable student transit fleet.",
  },
  {
    icon: Library,
    title: "Library & Clubs",
    desc: "Rich physical & digital library with engaging extracurriculars.",
  },
];

export default function TenantLandingPage() {
  const { tenant } = useTenant();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  if (!tenant) return null;

  const primaryColor = tenant.primary_color || "#1e3a8a";
  const bgHeroUrl = tenant.login_background_url || FALLBACK_HERO;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-slate-200 selection:text-slate-900 flex flex-col justify-between">
      <div>
        {/* ------------------------------------------------------------------- */}
        {/* FLOATING NAVIGATION BAR                                            */}
        {/* ------------------------------------------------------------------- */}
        <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 transition-all duration-300">
          <div className="max-w-7xl mx-auto rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-lg shadow-black/5 px-6 py-3 flex items-center justify-between">
            {/* School Brand / Logo */}
            <Link href={`/${tenant.slug}`} className="flex items-center gap-3 group">
              {tenant.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="h-10 w-10 rounded-xl object-contain bg-white/50 p-1 shadow-sm transition-transform group-hover:scale-105"
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  {tenant.name.charAt(0)}
                </div>
              )}
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-800">
                {tenant.name}
              </span>
            </Link>

            {/* Desktop Navigation Grouped at Far Right */}
            <div className="hidden md:flex items-center gap-6">
              <a
                href="#features"
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Why Choose Us
              </a>
              <Link
                href={`/${tenant.slug}/login`}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md hover:shadow-xl hover:opacity-95 transition-all transform active:scale-95 flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                Portal Login
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="md:hidden mt-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-100 shadow-2xl p-6 flex flex-col gap-4 text-slate-700 font-semibold"
              >
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-slate-900"
                >
                  Why Choose Us
                </a>
                <hr className="border-slate-100 my-1" />
                <Link
                  href={`/${tenant.slug}/login`}
                  className="w-full py-3 rounded-xl font-semibold text-center text-white shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  Portal Login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* ------------------------------------------------------------------- */}
        {/* HERO LANDING SECTION                                              */}
        {/* ------------------------------------------------------------------- */}
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <motion.div style={{ y: heroY }} className="absolute inset-0 z-0">
            <div
              className="absolute inset-0 bg-cover bg-center scale-105"
              style={{ backgroundImage: `url(${bgHeroUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950/90" />
          </motion.div>

          <motion.div
            style={{ opacity: heroOpacity }}
            className="relative z-10 max-w-5xl mx-auto px-6 pt-24 text-center flex flex-col items-center"
          >
            {tenant.logo_url && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="p-3 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 mb-6 shadow-2xl"
              >
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="h-24 w-24 sm:h-28 sm:w-28 object-contain rounded-2xl bg-white p-2"
                />
              </motion.div>
            )}

            <motion.span
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide uppercase bg-white/10 border border-white/20 text-white/90 backdrop-blur-sm mb-4"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Welcome To
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white drop-shadow-md"
            >
              {tenant.name}
            </motion.h1>

            {!tenant.login_background_url && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-6 text-lg sm:text-xl text-slate-200 max-w-2xl font-light leading-relaxed"
              >
                Empowering the leaders of tomorrow through holistic excellence, modern innovation, and enduring values.
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <Link
                href={`/${tenant.slug}/login`}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-white shadow-xl hover:shadow-2xl hover:brightness-110 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 text-base"
                style={{ backgroundColor: primaryColor }}
              >
                Login Portal
                <ArrowRight className="w-5 h-5" />
              </Link>

              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md transition-all text-center text-base"
              >
                Learn More
              </a>
            </motion.div>
          </motion.div>
        </section>

        {/* ------------------------------------------------------------------- */}
        {/* WHY CHOOSE US / FEATURES SECTION                                */}
        {/* ------------------------------------------------------------------- */}
        <section id="features" className="py-24 bg-slate-100/70 border-t border-slate-200/60 px-6 sm:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold tracking-wider uppercase px-3.5 py-1.5 rounded-full bg-slate-200 text-slate-700">
                Why Choose Us
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-4">
                Engineered for Complete Educational Success
              </h2>
              <p className="text-slate-600 text-base sm:text-lg mt-4">
                Everything required to ensure seamless learning, efficient administration, and parent-teacher transparency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {FEATURES.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    whileHover={{ y: -6 }}
                    className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-md hover:shadow-xl transition-all flex flex-col group"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-md transition-transform group-hover:scale-110"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* FOOTER (TENANT DATA ONLY)                                           */}
      {/* ------------------------------------------------------------------- */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-12 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {tenant.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="h-10 w-10 rounded-xl object-contain bg-white p-1"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {tenant.name.charAt(0)}
              </div>
            )}
            <span className="font-extrabold text-xl text-white tracking-tight">
              {tenant.name}
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <a href="#features" className="hover:text-white transition-colors">
              Why Choose Us
            </a>
            <Link href={`/${tenant.slug}/login`} className="hover:text-white transition-colors">
              Portal Login
            </Link>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {tenant.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
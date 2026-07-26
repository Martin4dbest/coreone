"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bus,
  Library,
  Trophy,
  ExternalLink,
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";

// Fallback images in case the tenant hasn't uploaded customized assets
const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1920&auto=format&fit=crop";
const FALLBACK_ABOUT =
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop";

const GALLERY_PLACEHOLDERS = [
  {
    url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop",
    title: "Interactive Learning",
  },
  {
    url: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=800&auto=format&fit=crop",
    title: "Campus Architecture",
  },
  {
    url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop",
    title: "Science & Innovation",
  },
  {
    url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800&auto=format&fit=crop",
    title: "Student Life & Community",
  },
  {
    url: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?q=80&w=800&auto=format&fit=crop",
    title: "Athletics & Sports",
  },
  {
    url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop",
    title: "Library & Research",
  },
];

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

const STATS = [
  { label: "Active Students", value: 1200, suffix: "+" },
  { label: "Expert Faculty", value: 85, suffix: "+" },
  { label: "Academic Programs", value: 34, suffix: "" },
  { label: "Years of Excellence", value: 25, suffix: "+" },
];

export default function TenantLandingPage() {
  const { tenant } = useTenant();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  if (!tenant) return null;

  // Primary & Secondary Brand Colors fallback handling
  const primaryColor = tenant.primary_color || "#1e3a8a";
  const secondaryColor = tenant.secondary_color || "#3b82f6";
  const bgHeroUrl = tenant.login_background_url || FALLBACK_HERO;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-slate-200 selection:text-slate-900">
      {/* ------------------------------------------------------------------- */}
      {/* 2. FLOATING NAVIGATION BAR                                          */}
      {/* ------------------------------------------------------------------- */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-lg shadow-black/5 px-6 py-3 flex items-center justify-between">
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

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#home" className="hover:text-slate-900 transition-colors">
              Home
            </a>
            <a href="#about" className="hover:text-slate-900 transition-colors">
              About
            </a>
            <a href="#gallery" className="hover:text-slate-900 transition-colors">
              Gallery
            </a>
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Why Choose Us
            </a>
            <a href="#admissions" className="hover:text-slate-900 transition-colors">
              Admissions
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
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
                href="#home"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-slate-900"
              >
                Home
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-slate-900"
              >
                About
              </a>
              <a
                href="#gallery"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-slate-900"
              >
                Gallery
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-slate-900"
              >
                Why Choose Us
              </a>
              <a
                href="#admissions"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-slate-900"
              >
                Admissions
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
      {/* 1. FULL SCREEN HERO WITH PARALLAX                                   */}
      {/* ------------------------------------------------------------------- */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${bgHeroUrl})` }}
          />
          {/* Overlay gradient for high contrast */}
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
              href="#about"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md transition-all text-center text-base"
            >
              Learn More
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 3. ABOUT SCHOOL SECTION                                             */}
      {/* ------------------------------------------------------------------- */}
      <section id="about" className="py-28 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative h-[450px] sm:h-[550px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <Image
                src={FALLBACK_ABOUT}
                alt="About School"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl bg-white/90 backdrop-blur-md shadow-xl">
                <p className="font-bold text-slate-900 text-lg">Academic Prestige</p>
                <p className="text-sm text-slate-600 mt-1">
                  Nurturing intellectual curiosity and moral character.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-200/60 w-fit">
              About Our Academy
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              A Culture of Excellence & Future Readiness
            </h2>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              At <strong className="text-slate-800">{tenant.name}</strong>, we cultivate an environment where ambition meets opportunity. Our robust curriculum combines classical rigor with contemporary technological tools.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                  Our Mission
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  To provide world-class education that empowers students to reach their highest potential morally and intellectually.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  Our Vision
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  To remain a premier institution known globally for producing creative, responsible, and visionary global citizens.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg mb-3">Core Values</h3>
              <div className="flex flex-wrap gap-2">
                {["Integrity", "Innovation", "Inclusivity", "Discipline", "Leadership"].map(
                  (val) => (
                    <span
                      key={val}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {val}
                    </span>
                  )
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 5. WHY CHOOSE US / FEATURES                                         */}
      {/* ------------------------------------------------------------------- */}
      <section id="features" className="py-24 bg-slate-100/70 border-y border-slate-200/60 px-6 sm:px-12">
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

      {/* ------------------------------------------------------------------- */}
      {/* 6. STATISTICS                                                       */}
      {/* ------------------------------------------------------------------- */}
      <section className="py-20 px-6 sm:px-12 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <div
                className="text-4xl sm:text-6xl font-black mb-2 tracking-tight"
                style={{ color: secondaryColor }}
              >
                {stat.value}
                {stat.suffix}
              </div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 4. GALLERY SECTION WITH LIGHTBOX                                    */}
      {/* ------------------------------------------------------------------- */}
      <section id="gallery" className="py-28 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-wider uppercase px-3.5 py-1.5 rounded-full bg-slate-200 text-slate-700">
            Campus Life
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-4">
            Moments Across Our Academy
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-4">
            A glimpse into everyday learning, innovation, culture, and sports.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_PLACEHOLDERS.map((img, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedImage(img.url)}
              className="relative h-72 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all cursor-pointer group"
            >
              <Image
                src={img.url}
                alt={img.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <p className="text-white font-bold text-lg flex items-center justify-between w-full">
                  {img.title}
                  <ExternalLink className="w-5 h-5 text-white/80" />
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="relative max-w-5xl max-h-[85vh] w-full h-full rounded-2xl overflow-hidden"
              >
                <Image
                  src={selectedImage}
                  alt="Expanded view"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </motion.div>
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-6 right-6 text-white p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 7. CALL TO ACTION (CTA)                                             */}
      {/* ------------------------------------------------------------------- */}
      <section id="admissions" className="py-20 px-6 sm:px-12">
        <div
          className="max-w-7xl mx-auto rounded-3xl p-10 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl"
          style={{ backgroundColor: secondaryColor }}
        >
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-black/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-6">
              Ready to Join Us? Your Future Starts Here.
            </h2>
            <p className="text-white/90 text-lg sm:text-xl font-light mb-10 leading-relaxed">
              Enrollments for the upcoming academic session are now open. Secure your child's position in an environment tailored for success.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/${tenant.slug}/login`}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold bg-white text-slate-900 shadow-xl hover:bg-slate-100 transition-all text-base"
              >
                Apply Now
              </Link>
              <Link
                href={`/${tenant.slug}/login`}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold bg-black/20 hover:bg-black/30 border border-white/20 backdrop-blur-sm text-white transition-all text-base"
              >
                Login Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 8. FOOTER                                                           */}
      {/* ------------------------------------------------------------------- */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 pt-16 pb-12 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-1 flex flex-col gap-4">
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
            <p className="text-sm leading-relaxed text-slate-400">
              Delivering high-quality education and student-centered growth through technology and community leadership.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>
                <a href="#home" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Why Choose Us
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-white transition-colors">
                  Campus Gallery
                </a>
              </li>
              <li>
                <Link href={`/${tenant.slug}/login`} className="hover:text-white transition-colors">
                  Portal Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Contact Us
            </h4>
            <ul className="flex flex-col gap-3 text-sm">
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>123 Academic Way, School District</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>+1 (555) 019-2834</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>info@{tenant.slug}.edu</span>
              </li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Access Portals
            </h4>
            <div className="flex flex-col gap-3">
              <Link
                href={`/${tenant.slug}/login`}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white hover:border-slate-700 transition-colors text-center"
              >
                Student & Parent Portal
              </Link>
              <Link
                href={`/${tenant.slug}/login`}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white hover:border-slate-700 transition-colors text-center"
              >
                Staff & Administration
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} {tenant.name}. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Powered by <span className="text-slate-300 font-semibold">PreSense SaaS</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
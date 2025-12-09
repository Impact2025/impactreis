import Link from "next/link";
import { Brain, Target, Zap, TrendingUp, Calendar, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32">
          <div className="text-center">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl mb-8 shadow-2xl shadow-indigo-500/50">
              <Brain className="text-white" size={40} />
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 tracking-tight">
              Jouw Personal
              <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Operating System
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Speciaal ontworpen voor <span className="text-indigo-400 font-semibold">hoogbegaafde ondernemers</span> die hun potentieel willen maximaliseren
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/register"
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl font-bold text-lg transition-all hover:shadow-2xl hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                Start Gratis
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
              <Link
                href="/auth/login"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all active:scale-95"
              >
                Inloggen
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Alles wat je nodig hebt om te{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              excelleren
            </span>
          </h2>
          <p className="text-xl text-slate-400">
            Een compleet systeem voor focus, groei en succes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Target size={28} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Doelen & Planning</h3>
            <p className="text-slate-400">
              Van BHAG tot dagelijkse acties. Houd focus op wat echt belangrijk is met ons hiërarchische doel-systeem.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Calendar size={28} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Focus Sessies</h3>
            <p className="text-slate-400">
              Deep work zoals het bedoeld is. Pomodoro-technieken en distraction-free periodes voor maximale productiviteit.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap size={28} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Habits Tracking</h3>
            <p className="text-slate-400">
              Bouw gewoontes die blijven plakken. Track je streaks en zie je momentum groeien, dag na dag.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp size={28} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Analytics & Insights</h3>
            <p className="text-slate-400">
              Data-driven groei. Zie precies wat werkt en waar je energie naartoe gaat met uitgebreide statistieken.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={28} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Weekly Reviews</h3>
            <p className="text-slate-400">
              Reflecteer en optimaliseer. Wekelijkse check-ins houden je scherp en op koers naar je grootse doelen.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles size={28} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Ochtend & Avond Rituelen</h3>
            <p className="text-slate-400">
              Start en eindig je dag met intentie. Structured logging voor consistent persoonlijk leiderschap.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-4">
            Klaar om je productiviteit te transformeren?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join hoogbegaafde ondernemers die hun potentieel al maximaliseren
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-10 py-5 bg-white text-indigo-600 rounded-2xl font-bold text-lg hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95 shadow-xl"
          >
            Start Nu Gratis
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-400">
          <p>&copy; 2025 Mijn Ondernemers OS. Gemaakt voor excellentie.</p>
        </div>
      </div>
    </div>
  );
}

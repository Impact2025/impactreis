'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Sunrise, Sparkles } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { isMorningRitualComplete } from '@/lib/weekflow.service';
import { BreathworkTimer } from '@/components/robbins/breathwork-timer';
import { StateCheck, StateComparison } from '@/components/robbins/state-check';
import { GratitudeTrio } from '@/components/robbins/gratitude-trio';
import { VisualizationWins } from '@/components/robbins/visualization-wins';
import { IdentityStatement } from '@/components/robbins/identity-statement';
import { Celebration } from '@/components/robbins/celebration';

type Step = 'status' | 'state-before' | 'breathwork' | 'gratitude' | 'visualization' | 'identity' | 'state-after' | 'complete';

interface MorningRitualData {
  wakeTime: string;
  sleepQuality: number;
  energyLevel: number;
  // New Robbins fields
  stateBefore: number;
  stateAfter: number;
  primingCompleted: boolean;
  gratitudes: string[];
  visualizedWins: string[];
  identityStatement: string;
  todayTop3: string[];
  intention: string;
  affirmation: string;
}

const steps: { id: Step; label: string }[] = [
  { id: 'status', label: 'Status' },
  { id: 'state-before', label: 'State' },
  { id: 'breathwork', label: 'Adem' },
  { id: 'gratitude', label: 'Dankbaar' },
  { id: 'visualization', label: 'Wins' },
  { id: 'identity', label: 'Identiteit' },
  { id: 'state-after', label: 'Resultaat' },
];

export default function MorningPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('status');
  const [showCelebration, setShowCelebration] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState<MorningRitualData>({
    wakeTime: '',
    sleepQuality: 7,
    energyLevel: 7,
    stateBefore: 5,
    stateAfter: 5,
    primingCompleted: false,
    gratitudes: ['', '', ''],
    visualizedWins: ['', '', ''],
    identityStatement: '',
    todayTop3: ['', '', ''],
    intention: '',
    affirmation: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.isAuthenticated() ? { email: 'user@example.com' } : null;
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }

        const today = new Date().toISOString().split('T')[0];

        try {
          const dbLogs = await api.logs.getByTypeAndDate('morning', today);
          if (dbLogs && dbLogs.length > 0) {
            const rawData = dbLogs[0].data;
            const dbData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
            setFormData(prev => ({ ...prev, ...dbData }));
            localStorage.setItem(`morningRitual_${today}`, JSON.stringify(dbData));
            setLoading(false);
            return;
          }
        } catch (dbError) {
          console.log('Could not fetch from database, checking localStorage');
        }

        const savedRitual = localStorage.getItem(`morningRitual_${today}`);
        if (savedRitual) {
          const parsed = JSON.parse(savedRitual);
          setFormData(prev => ({ ...prev, ...parsed }));
        } else {
          const now = new Date();
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          setFormData(prev => ({ ...prev, wakeTime: `${hours}:${minutes}` }));
        }
      } catch (err) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    } else {
      handleSubmit();
    }
  };

  const goToPrevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const finalData = { ...formData, primingCompleted: true };
      localStorage.setItem(`morningRitual_${today}`, JSON.stringify(finalData));

      await api.logs.create({
        type: 'morning',
        date: today,
        data: finalData,
        createdAt: new Date().toISOString()
      });

      setCurrentStep('complete');
      setShowCelebration(true);
    } catch (error) {
      console.error('Failed to save morning ritual:', error);
      setCurrentStep('complete');
      setShowCelebration(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-600 dark:border-amber-400 border-t-transparent" />
      </div>
    );
  }

  if (showCelebration) {
    return (
      <Celebration
        type="ritual"
        message="Je ochtend priming is voltooid!"
        subMessage={`State: ${formData.stateBefore} → ${formData.stateAfter} (+${formData.stateAfter - formData.stateBefore})`}
        onComplete={() => router.push('/dashboard')}
        autoCloseDelay={4000}
      />
    );
  }

  const isAlreadyComplete = isMorningRitualComplete();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-amber-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <Sunrise className="text-amber-600 dark:text-amber-400" size={20} />
              <h1 className="font-semibold text-slate-900 dark:text-white">Ochtend Priming</h1>
            </div>
            <div className="w-8" />
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = currentStepIndex === index;
              const isCompleted = currentStepIndex > index;

              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isActive
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {isCompleted ? <Check size={14} /> : index + 1}
                  </div>
                  <span className={`text-xs mt-1 ${
                    isActive ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {isAlreadyComplete && currentStep === 'status' && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mb-6 border border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-emerald-800 dark:text-emerald-200">
              Je hebt vandaag al geprimed! Je kunt het opnieuw doen om te verbeteren.
            </p>
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">
          {/* Step 1: Status */}
          {currentStep === 'status' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Goedemorgen! Hoe sta je op?
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Laten we je dag starten met intentie en energie
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                <div className="p-4">
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">Wakker geworden om</label>
                  <input
                    type="time"
                    value={formData.wakeTime}
                    onChange={(e) => setFormData({ ...formData, wakeTime: e.target.value })}
                    className="w-full px-0 py-1 bg-transparent border-none text-slate-900 dark:text-white text-lg focus:outline-none"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-slate-500 dark:text-slate-400">Slaapkwaliteit</label>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{formData.sleepQuality}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.sleepQuality}
                    onChange={(e) => setFormData({ ...formData, sleepQuality: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-slate-500 dark:text-slate-400">Energie niveau</label>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{formData.energyLevel}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.energyLevel}
                    onChange={(e) => setFormData({ ...formData, energyLevel: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: State Before */}
          {currentStep === 'state-before' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Wat is je huidige staat?
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  We gaan dit straks verbeteren met priming
                </p>
              </div>

              <StateCheck
                label="Huidige State"
                description="Hoe voel je je op dit moment? (1-10)"
                value={formData.stateBefore}
                onChange={(value) => setFormData({ ...formData, stateBefore: value })}
              />

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Let op:</strong> Na de priming oefeningen meten we je staat opnieuw.
                  De meeste mensen ervaren een verbetering van 2-4 punten!
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Breathwork */}
          {currentStep === 'breathwork' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Power Breathing
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Verander je fysiologie, verander je staat
                </p>
              </div>

              <BreathworkTimer
                onComplete={() => {
                  // Auto-advance after breathwork
                  setTimeout(goToNextStep, 1000);
                }}
                totalBreaths={30}
              />
            </div>
          )}

          {/* Step 4: Gratitude */}
          {currentStep === 'gratitude' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Dankbaarheid Praktijk
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Voel elke dankbaarheid diep in je hart
                </p>
              </div>

              <GratitudeTrio
                values={formData.gratitudes}
                onChange={(values) => setFormData({ ...formData, gratitudes: values })}
              />
            </div>
          )}

          {/* Step 5: Visualization */}
          {currentStep === 'visualization' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  3 Wins Visualisatie
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Zie vandaag als al voltooid - voel het succes
                </p>
              </div>

              <VisualizationWins
                values={formData.visualizedWins}
                onChange={(values) => setFormData({ ...formData, visualizedWins: values })}
              />
            </div>
          )}

          {/* Step 6: Identity */}
          {currentStep === 'identity' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Identiteit Bevestiging
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Wie ben jij? Claim je identiteit.
                </p>
              </div>

              <IdentityStatement
                value={formData.identityStatement}
                onChange={(value) => setFormData({ ...formData, identityStatement: value })}
              />
            </div>
          )}

          {/* Step 7: State After */}
          {currentStep === 'state-after' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Je Nieuwe Staat
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Hoe voel je je nu na de priming?
                </p>
              </div>

              <StateCheck
                label="State Na Priming"
                description="Meet je staat opnieuw"
                value={formData.stateAfter}
                onChange={(value) => setFormData({ ...formData, stateAfter: value })}
                showImprovement={true}
                previousValue={formData.stateBefore}
              />

              {formData.stateAfter > formData.stateBefore && (
                <StateComparison
                  beforeValue={formData.stateBefore}
                  afterValue={formData.stateAfter}
                />
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStepIndex > 0 && (
            <button
              onClick={goToPrevStep}
              className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={18} />
              Vorige
            </button>
          )}

          <button
            onClick={goToNextStep}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {currentStepIndex === steps.length - 1 ? (
              <>
                {saving ? 'Opslaan...' : 'Voltooien'}
                <Sparkles size={18} />
              </>
            ) : (
              <>
                Volgende
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        {/* Tony Quote */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            "The quality of your life is the quality of your rituals."
            <span className="block text-xs mt-1">— Tony Robbins</span>
          </p>
        </div>
      </main>
    </div>
  );
}

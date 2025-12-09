import React, { useState, useEffect } from 'react';
// Removed Firestore imports - using Neon API instead
import { 
  Sun, Moon, Target, ArrowRight, CheckCircle, 
  BarChart2, Flame, LogOut, Activity, 
  Calendar, Zap, Brain, AlertCircle, X,
  Mountain, Flag, Map, Trash2, Save, Lock, User, 
  ClipboardList, ChevronRight, ChevronLeft, Play, Heart, Star, Sparkles, ListChecks,
  Clock, Dumbbell, BookOpen, Droplets, Smile, Trophy, Quote, Compass, Book, Timer
} from 'lucide-react';

// --- CONFIGURATIE ---
const API_BASE = 'http://localhost:3001/api'; // Neon API base URL

// --- UTILS ---
const cn = (...classes) => classes.filter(Boolean).join(' ');
const getTodayString = () => new Date().toISOString().split('T')[0];
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Goedemorgen, Brein";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
};
const getCurrentQuarter = () => `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
const getCurrentMonthName = () => new Date().toLocaleString('nl-NL', { month: 'long' });
const getWeekNumber = (d = new Date()) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
};
const isWeekendOrFriday = () => {
  const day = new Date().getDay();
  return day === 5 || day === 6 || day === 0;
};

const isFocusDay = () => {
  const day = new Date().getDay();
  return day === 1 || day === 2 || day === 4; // Mon, Tue, Thu
};

const getCurrentTime = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes(); // minutes since midnight
};

// --- DATA: MICHAEL PILARCZYK & COACHING ---
const pilarczykBooks = [
  { title: "Master Your Mindset", author: "Michael Pilarczyk", tagline: "Leef je mooiste leven", category: "Mindset", coachTip: "Je bent vandaag waar je gedachten je hebben gebracht." },
  { title: "Design Your Own Life", author: "Michael Pilarczyk", tagline: "Meesterschap & Levenskunst", category: "Strategie", coachTip: "Ontwerp je toekomst, wacht niet af." },
  { title: "Je bent zoals je denkt", author: "Michael Pilarczyk", tagline: "Verbinding met de bron", category: "Spiritualiteit", coachTip: "Gedachten zijn krachten." },
  { title: "Think and Grow Rich", author: "Napoleon Hill (Vert. MP)", tagline: "De succesbijbel", category: "Succes", coachTip: "Alles begint met een brandend verlangen." },
];

const recommendedBooks = [
  { title: "Deep Work", author: "Cal Newport", category: "Focus", coachTip: "Focus is de superkracht van de 21e eeuw." },
  { title: "The 7 Habits", author: "Stephen Covey", category: "Leiderschap", coachTip: "Begin met het einde voor ogen." },
];

// --- FOCUS TIMER ---
const FocusTimer = ({ onStart, onComplete }) => {
  const [goal, setGoal] = useState('');
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete && onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const handleStart = () => {
    if (!goal.trim()) return;
    setIsRunning(true);
    setStartTime(new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }));
    onStart && onStart(goal);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Timer size={32} className="text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Focus Sessie</h2>
          <p className="text-slate-500 mt-2">90 minuten diepe focus</p>
        </div>

        {!isRunning ? (
          <div className="space-y-6">
            <InputField
              label="Wat is je focus doel?"
              value={goal}
              onChange={setGoal}
              placeholder="Specifiek doel voor deze sessie..."
              autoFocus
            />
            <Button onClick={handleStart} disabled={!goal.trim()} className="w-full">
              Start Focus Sessie
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="text-6xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {formatTime(timeLeft)}
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl">
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1">Focus Doel</p>
              <p className="text-slate-800 dark:text-slate-200">{goal}</p>
              {startTime && <p className="text-xs text-slate-500 mt-2">Gestart om {startTime}</p>}
            </div>
            <p className="text-sm text-slate-500">Blijf gefocust - dit is je tijd!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- UI COMPONENTEN ---

const Toast = ({ message, type = 'success' }) => (
  <div className="fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-xl border border-indigo-100 dark:border-slate-700 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
    {type === 'success' ? <CheckCircle size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-rose-500" />}
    <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{message}</span>
  </div>
);

const Widget = ({ children, className = "", onClick, label, icon: Icon, active = false }) => (
  <div 
    onClick={onClick}
    className={cn(
      "relative overflow-hidden bg-white dark:bg-slate-800 rounded-[2rem] p-5 transition-all duration-300 border border-slate-100 dark:border-slate-700 shadow-sm",
      onClick ? "cursor-pointer active:scale-95 hover:shadow-md hover:-translate-y-0.5" : "",
      active ? "ring-2 ring-indigo-400 dark:ring-indigo-500" : "",
      className
    )}
  >
    {(label || Icon) && (
      <div className="flex items-center justify-between mb-3 text-slate-400 dark:text-slate-500">
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        {Icon && <Icon size={18} />}
      </div>
    )}
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false, icon: Icon }) => {
  const variants = {
    primary: "bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-200 dark:shadow-none",
    secondary: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600",
    ghost: "text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={cn("w-full py-4 rounded-2xl font-bold text-[15px] transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed", variants[variant], className)}>
      {disabled ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" /> : (Icon && <Icon size={18} />)}
      {children}
    </button>
  );
};

const RangeSlider = ({ label, value, onChange, min = 1, max = 10, leftIcon: LeftIcon }) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
    <div className="flex justify-between items-center mb-4">
      <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
        {LeftIcon && <LeftIcon size={18} className="text-indigo-400" />} {label}
      </label>
      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-lg">{value}</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
  </div>
);

const InputField = ({ label, value, onChange, placeholder, multiline = false, autoFocus = false, subtext = "" }) => (
  <div className="group">
    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1">{label}</label>
    {multiline ? (
      <textarea autoFocus={autoFocus} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border-0 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 min-h-[120px] resize-none transition-all placeholder:text-slate-400 font-medium" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <input type="text" autoFocus={autoFocus} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border-0 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-400 font-medium" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    )}
    {subtext && <p className="text-xs text-slate-400 mt-1 ml-1 italic">{subtext}</p>}
  </div>
);

const SelectField = ({ label, value, onChange, options, leftIcon: Icon }) => (
  <div className="bg-white dark:bg-slate-800 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm group hover:border-indigo-200 transition-colors">
    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 ml-4 mt-2 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-indigo-400" />} {label}
    </label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-3 bg-transparent text-lg font-bold text-slate-800 dark:text-white outline-none cursor-pointer">
      {options.map((opt) => <option key={opt} value={opt} className="dark:bg-slate-800">{opt}</option>)}
    </select>
  </div>
);

const ToggleItem = ({ label, icon: Icon, checked, onChange }) => (
  <div onClick={() => onChange(!checked)} className={cn("flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border", checked ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-200")}>
    <div className="flex items-center gap-3">
      <div className={cn("p-2 rounded-xl transition-colors", checked ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-800 dark:text-indigo-300" : "bg-slate-100 text-slate-400 dark:bg-slate-700")}><Icon size={20} /></div>
      <span className={cn("font-bold text-sm", checked ? "text-indigo-900 dark:text-indigo-100" : "text-slate-600 dark:text-slate-300")}>{label}</span>
    </div>
    <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", checked ? "bg-indigo-500 border-indigo-500" : "border-slate-300 dark:border-slate-600")}>{checked && <CheckCircle size={14} className="text-white" />}</div>
  </div>
);

// --- AUTH ---
const AuthScreen = ({ onLogin, onError }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const endpoint = isRegistering ? '/auth/register' : '/auth/login';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      onLogin(data.user);
    } catch (error) {
      onError(error.message || "Authenticatie mislukt.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200 dark:shadow-none"><Brain className="text-white" size={32} /></div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{isRegistering ? 'Start je reis' : 'Welkom terug'}</h1>
          <p className="text-slate-500 mt-2">Personal OS voor Hoogbegaafden</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <input className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 transition-colors text-slate-800 dark:text-white" type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 transition-colors text-slate-800 dark:text-white" type="password" placeholder="Wachtwoord" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" disabled={loading} className="mt-6">{isRegistering ? 'Account Maken' : 'Inloggen'}</Button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-center mt-6 text-sm text-slate-500 font-medium hover:text-indigo-600">{isRegistering ? 'Al een account? Log in' : 'Nieuw? Maak account'}</button>
      </div>
    </div>
  );
};

// --- DATA LOGIC ---
const useUserData = (user) => {
  const [data, setData] = useState({ habits: [], logs: [], goals: null, todayMorning: null, todayEvening: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        // Fetch habits
        const habitsRes = await fetch(`${API_BASE}/habits`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        let habits = await habitsRes.json();
        if (habits.length === 0) {
          // Add default habits
          await Promise.all(['Deep Focus', 'Bewegen', 'Leren'].map(name =>
            fetch(`${API_BASE}/habits`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ name, streak: 0 })
            })
          ));
          const newHabitsRes = await fetch(`${API_BASE}/habits`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          habits = await newHabitsRes.json();
        }
        // Fetch goals
        const goalsRes = await fetch(`${API_BASE}/goals`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const goals = await goalsRes.json();
        // Fetch logs
        const logsRes = await fetch(`${API_BASE}/logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const logsRaw = await logsRes.json();
        const logs = logsRaw.map(l => ({ id: l.id, ...l.data, type: l.type, dateString: l.date_string, timestamp: l.timestamp }));
        const today = getTodayString();
        setData({
          habits,
          logs,
          goals,
          todayMorning: logs.find(l => l.type === 'morning' && l.dateString === today),
          todayEvening: logs.find(l => l.type === 'evening' && l.dateString === today)
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);
  return { ...data, loading };
};

// --- VIEWS ---

const Dashboard = ({ user, userData, onNavigate }) => {
  const displayName = user.email.split('@')[0]; // Simple display name
  const { habits, todayMorning, todayEvening } = userData;
  const completedHabits = habits.filter(h => h.lastCompleted === getTodayString()).length;
  
  const getCoachTip = () => {
    if (!todayMorning) return "Je hersenen staan aan. Tijd om richting te kiezen. Start 'Ochtend'.";
    if (todayMorning.sleepQuality && todayMorning.sleepQuality < 6) return "Breinmist door slaapgebrek? Wees mild. Doe vandaag alleen wat écht moet.";
    if (todayMorning.energy && todayMorning.energy > 8) return "Hoog in je energie? Dit is HET moment voor die complexe taak.";
    if (todayMorning.stress && todayMorning.stress > 7) return "Je hoofd loopt over. Tijd voor een 'Braindump' om RAM-geheugen vrij te maken.";
    if (todayEvening) return "Systeem afsluiten. Morgen weer een dag vol nieuwe ideeën.";
    return "Blijf bij je focus. Laat je niet afleiden door 'nieuwe glimmende objecten'.";
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      <header className="flex justify-between items-end px-2">
        <div>
          <p className="text-sm font-bold text-indigo-400 dark:text-indigo-300 uppercase tracking-wide mb-1 flex items-center gap-1"><Calendar size={12} /> {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric' })}</p>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">{getGreeting()}, {displayName}</h1>
        </div>
        <button onClick={() => { localStorage.removeItem('user'); setUser(null); }} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"><LogOut size={18} /></button>
      </header>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl flex items-start gap-3 border border-indigo-100 dark:border-indigo-800/50">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-full text-indigo-500 shadow-sm shrink-0"><Brain size={16} /></div>
        <div><p className="text-xs font-bold text-indigo-400 uppercase mb-1">Coach</p><p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">"{getCoachTip()}"</p></div>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wider mb-6 border border-white/10"><Compass size={12} /> RICHTING</span>
          <p className="text-xl md:text-2xl font-medium leading-tight font-serif italic opacity-95">"Discipline is kiezen tussen wat je *nu* wilt en wat je *het allerliefst* wilt."</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Widget onClick={() => onNavigate('morning')} className={cn("col-span-1 aspect-square flex flex-col justify-between group", todayMorning ? "bg-white dark:bg-slate-800" : "bg-white dark:bg-slate-800")}>
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", todayMorning ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400")}>{todayMorning ? <CheckCircle size={24} /> : <Sun size={24} />}</div>
          <div><h3 className="font-bold text-lg text-slate-800 dark:text-white">Start</h3><p className="text-sm text-slate-500 font-medium mt-1">{todayMorning ? "Gepland" : "Intentie zetten"}</p></div>
        </Widget>
        <Widget onClick={() => onNavigate('evening')} className="col-span-1 aspect-square flex flex-col justify-between group">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", todayEvening ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400")}>{todayEvening ? <CheckCircle size={24} /> : <Moon size={24} />}</div>
          <div><h3 className="font-bold text-lg text-slate-800 dark:text-white">Stop</h3><p className="text-sm text-slate-500 font-medium mt-1">{todayEvening ? "Afgesloten" : "Reflectie"}</p></div>
        </Widget>
        <Widget onClick={() => onNavigate('weekly')} className="col-span-2 flex items-center justify-between border-0 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-4"><div className="p-3 rounded-2xl bg-white/20 text-indigo-500 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20"><ClipboardList size={24} /></div><div><h3 className="font-bold text-lg text-slate-800 dark:text-white">Weekly Review</h3><p className="text-sm text-slate-500">Zoom uit & leer</p></div></div><ArrowRight className="text-slate-300" />
        </Widget>

        {todayMorning?.focusBlock1 && (
          <div className="col-span-2 bg-white dark:bg-slate-800 rounded-[2rem] p-5 border border-slate-100 dark:border-slate-700">
             <div className="flex items-center gap-2 mb-4 text-indigo-500"><Zap size={18} /><span className="font-bold uppercase text-xs tracking-wider">Focus & Flow</span></div>
             <div className="space-y-4">
               <div className="flex gap-3 items-start p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl">
                 <span className="text-xl mt-0.5">🧠</span>
                 <div><p className="text-xs font-bold text-indigo-400 uppercase">Deep Dive (90m)</p><p className="text-sm font-bold text-slate-800 dark:text-slate-200">{todayMorning.focusBlock1}</p><p className="text-xs text-slate-500 mt-1 italic">"{todayMorning.focusBlock1Why}"</p></div>
               </div>
               {todayMorning.rabbitHole && (
                 <div className="flex gap-3 items-start p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                   <span className="text-xl mt-0.5">🐇</span>
                   <div><p className="text-xs font-bold text-amber-500 uppercase">Rabbit Hole</p><p className="text-sm font-medium text-slate-700 dark:text-slate-300">{todayMorning.rabbitHole}</p></div>
                 </div>
               )}
             </div>
          </div>
        )}

        <Widget onClick={() => onNavigate('goals')} className="col-span-1 h-32 flex flex-col justify-center items-center gap-2 text-center group"><div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Mountain size={20} /></div><span className="font-bold text-slate-700 dark:text-white text-sm">Grote Visie</span></Widget>
        {isFocusDay() && (
          <Widget onClick={() => setView('focus-timer')} className="col-span-1 h-32 flex flex-col justify-center items-center gap-2 text-center group"><div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Timer size={20} /></div><span className="font-bold text-slate-700 dark:text-white text-sm">Focus Timer</span></Widget>
        )}
        <Widget onClick={() => onNavigate('weekly-goals')} className="col-span-1 h-32 flex flex-col justify-center items-center gap-2 text-center group"><div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Target size={20} /></div><span className="font-bold text-slate-700 dark:text-white text-sm">Week Doelen</span></Widget>
        <Widget onClick={() => onNavigate('weekly-review')} className="col-span-1 h-32 flex flex-col justify-center items-center gap-2 text-center group"><div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform"><BarChart2 size={20} /></div><span className="font-bold text-slate-700 dark:text-white text-sm">Week Review</span></Widget>
        <Widget onClick={() => onNavigate('library')} className="col-span-1 h-32 flex flex-col justify-center items-center gap-2 text-center group"><div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Book size={20} /></div><span className="font-bold text-slate-700 dark:text-white text-sm">Bibliotheek</span></Widget>
        <Widget onClick={() => onNavigate('wins')} className="col-span-1 h-32 flex flex-col justify-center items-center gap-2 text-center group"><div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Trophy size={20} /></div><span className="font-bold text-slate-700 dark:text-white text-sm">Successen</span></Widget>
        <Widget onClick={() => onNavigate('insights')} className="col-span-1 h-32 flex flex-col justify-center items-center gap-2 text-center group"><div className="w-10 h-10 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-500 flex items-center justify-center group-hover:scale-110 transition-transform"><BarChart2 size={20} /></div><span className="font-bold text-slate-700 dark:text-white text-sm">Data</span></Widget>
      </div>

      {todayMorning?.mit && !todayEvening && (
        <div className="fixed bottom-6 left-6 right-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-indigo-100 dark:border-slate-700 p-5 rounded-[2rem] shadow-xl shadow-indigo-100 dark:shadow-none z-40 animate-in slide-in-from-bottom-10">
           <div className="flex items-start gap-4">
             <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full shrink-0 mt-1"><Target size={18} /></div>
             <div className="flex-1">
               <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Focus</p>
               <p className="font-bold text-slate-800 dark:text-white text-lg leading-tight">{todayMorning.mit}</p>
               {todayMorning.mitDoneCriteria && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 italic"><Flag size={10} /> Klaar als: {todayMorning.mitDoneCriteria}</p>}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

const Wizard = ({ title, icon: Icon, steps, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const handleNext = () => { if (currentStep < steps.length - 1) setCurrentStep(c => c + 1); else onComplete(answers); };
  const CurrentComponent = steps[currentStep].component;
  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom-full duration-500">
      <div className="px-6 pt-12 pb-4 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800"><button onClick={onCancel} className="text-slate-400">Annuleren</button><span className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Icon className="text-indigo-500" size={18} /> {title}</span><span className="w-16"></span></div>
      <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full"><div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} /></div>
      <div className="flex-1 overflow-y-auto p-6"><div className="max-w-md mx-auto py-8"><div className="mb-10 text-center"><h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-3">{steps[currentStep].title}</h2><p className="text-slate-500 text-lg">{steps[currentStep].description}</p></div><div className="space-y-6"><CurrentComponent value={answers} onChange={(key, val) => setAnswers(prev => ({ ...prev, [key]: val }))} /></div></div></div>
      <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800"><div className="max-w-md mx-auto flex gap-4">{currentStep > 0 && <button onClick={() => setCurrentStep(c => c - 1)} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white hover:bg-slate-200"><ChevronLeft /></button>}<Button onClick={handleNext} icon={currentStep === steps.length - 1 ? CheckCircle : ArrowRight}>{currentStep === steps.length - 1 ? 'Afronden' : 'Volgende'}</Button></div></div>
    </div>
  );
};

const LibraryView = ({ onBack }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-12 px-6 pb-10 animate-in slide-in-from-right duration-300">
    <div className="flex items-center gap-4 mb-8"><button onClick={onBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-slate-600 dark:text-white"><ChevronLeft size={20} /></button><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Bibliotheek</h2></div>
    <div className="max-w-lg mx-auto space-y-8 pb-20">
      <div><h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-4 ml-1">Michael Pilarczyk</h3><div className="space-y-4">{pilarczykBooks.map((b, i) => <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800"><h4 className="font-bold text-lg text-slate-800 dark:text-white">{b.title}</h4><p className="text-sm text-slate-500 mb-3">{b.tagline}</p><div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800/50"><p className="text-xs font-bold text-indigo-400 uppercase mb-1">Coach Tip</p><p className="text-sm text-slate-700 dark:text-slate-300 italic">"{b.coachTip}"</p></div></div>)}</div></div>
      <div><h3 className="text-sm font-bold text-teal-500 uppercase tracking-wider mb-4 ml-1">Aanbevolen</h3><div className="space-y-4">{recommendedBooks.map((b, i) => <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800"><h4 className="font-bold text-lg text-slate-800 dark:text-white">{b.title}</h4><p className="text-sm text-slate-500 mb-3">{b.author}</p><p className="text-sm text-slate-700 dark:text-slate-300 italic">"{b.coachTip}"</p></div>)}</div></div>
    </div>
  </div>
);

// --- MAIN CONTAINER ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const userData = useUserData(user);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setAuthChecking(false);
  }, []);

  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  
  const handleSaveLog = async (logData, type) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...logData, type, dateString: getTodayString() })
      });
      showToast("Opgeslagen!");
      setView('dashboard');
      // Refresh data
      window.location.reload(); // Simple refresh for now
    } catch { showToast("Fout!", "error"); }
  };
  const handleSaveWeeklyReview = async (data) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/weekly-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...data, weekNumber: getWeekNumber() })
      });
      showToast("Review Compleet!");
      setView('dashboard');
    } catch { showToast("Fout!", "error"); }
  };

  const handleStartFocusSession = async (goal) => {
    if (!user) return;
    const now = new Date();
    const date = getTodayString();
    const startTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/focus-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ date, startTime, goal })
      });
    } catch (error) {
      console.error('Error starting focus session:', error);
    }
  };

  const handleCompleteFocusSession = async () => {
    // Find today's latest session and mark complete
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const sessions = await fetch(`${API_BASE}/focus-sessions?date=${getTodayString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());
      const latest = sessions.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
      if (latest) {
        await fetch(`${API_BASE}/focus-sessions/${latest.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ completed: true })
        });
      }
      showToast("Focus sessie voltooid! 🎉");
      setView('dashboard');
    } catch (error) {
      console.error('Error completing focus session:', error);
    }
  };
  const handleSaveGoals = async (goalsData) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/goals`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(goalsData)
      });
      showToast("Doelen opgeslagen!");
      setView('dashboard');
      // Refresh data
      window.location.reload();
    } catch { showToast("Fout!", "error"); }
  };

  const handleSaveWeeklyGoals = async (weeklyGoalsData) => {
    if (!user) return;
    try {
      const weekNumber = getWeekNumber();
      await fetch(`${API_BASE}/weekly-goals/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekNumber, goals: weeklyGoalsData })
      });
      showToast("Week doelen opgeslagen!");
      setView('dashboard');
      window.location.reload();
    } catch { showToast("Fout!", "error"); }
  };
  const handleToggleHabit = async (habit) => {
    if (!user) return;
    const today = getTodayString();
    const isCompletedToday = habit.last_completed === today;
    const newStreak = isCompletedToday ? Math.max(0, habit.streak - 1) : habit.streak + 1;
    const newLastCompleted = isCompletedToday ? null : today;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/habits/${habit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ streak: newStreak, lastCompleted: newLastCompleted })
      });
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const wakeUpOptions = ["05:00", "05:15", "05:30", "05:45", "06:00", "06:15", "06:30", "06:45", "07:00", "07:15", "07:30", "07:45", "08:00+"];
  const sleepOptions = ["21:30", "21:45", "22:00", "22:15", "22:30", "22:45", "23:00", "23:15", "23:30", "Later"];

  const morningSteps = [
    { title: "Systeem Start", description: "Biorythme check.", component: ({ value, onChange }) => (
      <div className="space-y-6"><SelectField label="Hoe laat ben je opgestaan?" value={value.wakeUpTime || '07:00'} onChange={v => onChange('wakeUpTime', v)} options={wakeUpOptions} leftIcon={Clock} /><RangeSlider label="Slaapkwaliteit" value={value.sleepQuality || 7} onChange={v => onChange('sleepQuality', v)} leftIcon={Moon} /></div>
    )},
    { title: "Activatie", description: "Lichaam & Geest aan.", component: ({ value, onChange }) => (
      <div className="space-y-3"><p className="text-sm font-bold text-slate-400 uppercase ml-1 mb-2">Checklist:</p><ToggleItem label="Beweging / Sport" icon={Dumbbell} checked={value.didExercise} onChange={v => onChange('didExercise', v)} /><ToggleItem label="Meditatie / Rust" icon={Brain} checked={value.didMeditate} onChange={v => onChange('didMeditate', v)} /><ToggleItem label="Intellectuele Input (Lezen)" icon={BookOpen} checked={value.didRead} onChange={v => onChange('didRead', v)} /><ToggleItem label="Koud (af)douchen" icon={Droplets} checked={value.didColdShower} onChange={v => onChange('didColdShower', v)} /></div>
    )},
    { title: "HB Check-in", description: "Hoe staat je brein?", component: ({ value, onChange }) => (
      <div className="space-y-6">
        <RangeSlider label="Mentale Energie" value={value.energy || 7} onChange={v => onChange('energy', v)} leftIcon={Zap} />
        <RangeSlider label="Prikkelbaarheid" value={value.stress || 3} onChange={v => onChange('stress', v)} leftIcon={Activity} />
        {isFocusDay() && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-200 dark:border-red-800">
            <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">📅 Focus Dag</p>
            <p className="text-sm text-red-700 dark:text-red-300">Vergeet niet je 90-minuten focus sessies om 08:30 en 12:30!</p>
          </div>
        )}
      </div>
    )},
    { title: "Deep Dive Planning", description: "Waar ga je in duiken?", component: ({ value, onChange }) => (
      <div className="space-y-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl"><p className="text-xs font-bold text-indigo-500 uppercase mb-2">🚀 Deep Dive (De #1 Focus)</p><InputField label="Wat ga je doen?" value={value.focusBlock1 || ''} onChange={v => onChange('focusBlock1', v)} placeholder="De complexe taak..." /><InputField label="Waarom is dit belangrijk?" value={value.focusBlock1Why || ''} onChange={v => onChange('focusBlock1Why', v)} placeholder="Koppel aan je visie..." subtext="Zonder 'waarom' ga je het uitstellen." /></div>
        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl"><p className="text-xs font-bold text-amber-500 uppercase mb-2">🐇 Rabbit Hole / Side Project</p><InputField label="Waar wil je vandaag over leren/maken?" value={value.rabbitHole || ''} onChange={v => onChange('rabbitHole', v)} placeholder="Je passie project..." subtext="Geef jezelf toestemming om hier tijd aan te besteden." /></div>
      </div>
    )},
    { title: "Concretiseren", description: "Maak het klein.", component: ({ value, onChange }) => (
      <div className="space-y-6"><div><InputField label="Wat is de 'Definition of Done'?" value={value.mitDoneCriteria || ''} onChange={v => onChange('mitDoneCriteria', v)} placeholder="Wanneer mag je stoppen?" subtext="Voorkom perfectionisme." autoFocus /></div><div><InputField label="Jouw MIT (One Thing)" value={value.mit || ''} onChange={v => onChange('mit', v)} placeholder="De titel van je dag..." /></div></div>
    )}
  ];

  const eveningSteps = [
    { title: "Check-out", description: "Resultaten boeken.", component: ({ value, onChange }) => (
      <div className="space-y-4"><div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700"><p className="text-xs font-bold text-slate-400 uppercase mb-3">Jouw Focus</p>{userData.todayMorning ? (<ToggleItem label={userData.todayMorning.mit} icon={Target} checked={value.mitDone} onChange={v => onChange('mitDone', v)} />) : <p className="text-slate-500">Geen ochtendplanning.</p>}</div><p className="text-sm text-slate-500 italic">"Heb je progressie gemaakt? Dat is genoeg."</p></div>
    )},
    { title: "Chaos naar Orde", description: "Leeg je werkgeheugen.", component: ({ value, onChange }) => (
      <div className="space-y-6">
        <InputField label="Braindump: Wat zit er in je hoofd?" value={value.braindump || ''} onChange={v => onChange('braindump', v)} placeholder="Ideeën, zorgen, to-dos... dump het hier." multiline autoFocus />
        <div className="space-y-4">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">3 Dingen waar je dankbaar voor bent:</p>
          <InputField label="1." value={value.gratitude1 || ''} onChange={v => onChange('gratitude1', v)} placeholder="Eerste ding..." />
          <InputField label="2." value={value.gratitude2 || ''} onChange={v => onChange('gratitude2', v)} placeholder="Tweede ding..." />
          <InputField label="3." value={value.gratitude3 || ''} onChange={v => onChange('gratitude3', v)} placeholder="Derde ding..." />
        </div>
        <RangeSlider label="Cijfer voor de dag" value={value.rating || 7} onChange={v => onChange('rating', v)} leftIcon={Star} />
      </div>
    )},
    { title: "Systeem Reset", description: "Plan voor morgen.", component: ({ value, onChange }) => (
      <div className="space-y-6"><InputField label="Wat is de focus voor morgen?" value={value.tomorrowMit || ''} onChange={v => onChange('tomorrowMit', v)} placeholder="Als je wakker wordt, wat ga je doen?" /><SelectField label="Hoe laat ga je slapen?" value={value.sleepTime || '22:30'} onChange={v => onChange('sleepTime', v)} options={sleepOptions} leftIcon={Moon} /></div>
    )}
  ];

  const weeklyGoalsSteps = [
    { title: "Week Focus", description: "Wat ga je deze week bereiken?", component: ({ value, onChange }) => (
      <div className="space-y-6">
        <p className="text-sm text-slate-500">Stel 3-5 concrete doelen voor deze week. Koppel ze aan je BHAG of maand doelen.</p>
        {[1,2,3,4,5].map(i => (
          <InputField key={i} label={`Doel ${i}`} value={value[`goal${i}`] || ''} onChange={v => onChange(`goal${i}`, v)} placeholder={`Week doel ${i}...`} />
        ))}
      </div>
    )}
  ];

  const weeklyReviewSteps = [
    { title: "Week Review", description: "Hoe ging de week?", component: ({ value, onChange }) => (
      <div className="space-y-6">
        <p className="text-sm text-slate-500">Beoordeel je week doelen en reflecteer.</p>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Doel {i}: {value[`goal${i}`] || 'Niet ingesteld'}</p>
            <ToggleItem label="Voltooid" icon={CheckCircle} checked={value[`completed${i}`]} onChange={v => onChange(`completed${i}`, v)} />
          </div>
        ))}
        <InputField label="Wat ging goed?" value={value.reflection || ''} onChange={v => onChange('reflection', v)} multiline placeholder="Lessen geleerd..." />
      </div>
    )}
  ];

  // Placeholder for simple views like WinsView/GoalsView to keep file size manageable for copy-paste.
  // In VS Code, create separate files for these!
  // ... (WinsView, GoalsView, AnalyticsView, HabitList definitions omitted for brevity but logic is same as before) ...
  // Adding minimal versions to make it run:
  const WinsView = ({ logs, onBack }) => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-12 px-6 pb-10 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4 mb-8"><button onClick={onBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-slate-600 dark:text-white"><ChevronLeft size={20} /></button><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Successen</h2></div>
      <div className="max-w-lg mx-auto space-y-6 pb-20">
        {logs.filter(l => l.gratitude1 || l.gratitude2 || l.gratitude3).map(l => (
          <div key={l.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500 mb-3">{new Date(l.timestamp).toLocaleDateString('nl-NL')}</p>
            <div className="space-y-2">
              {l.gratitude1 && <p className="text-slate-800 dark:text-slate-200">• {l.gratitude1}</p>}
              {l.gratitude2 && <p className="text-slate-800 dark:text-slate-200">• {l.gratitude2}</p>}
              {l.gratitude3 && <p className="text-slate-800 dark:text-slate-200">• {l.gratitude3}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const GoalsView = ({ initialGoals, onSave, onBack }) => {
    const [goals, setGoals] = useState({
      bhag: initialGoals?.bhag || '',
      yearlyGoals: initialGoals?.yearly_goals || [],
      monthlyGoals: initialGoals?.monthly_goals || []
    });

    const addYearlyGoal = () => setGoals(prev => ({ ...prev, yearlyGoals: [...prev.yearlyGoals, ''] }));
    const updateYearlyGoal = (index, value) => setGoals(prev => ({ ...prev, yearlyGoals: prev.yearlyGoals.map((g, i) => i === index ? value : g) }));
    const removeYearlyGoal = (index) => setGoals(prev => ({ ...prev, yearlyGoals: prev.yearlyGoals.filter((_, i) => i !== index) }));

    const addMonthlyGoal = () => setGoals(prev => ({ ...prev, monthlyGoals: [...prev.monthlyGoals, ''] }));
    const updateMonthlyGoal = (index, value) => setGoals(prev => ({ ...prev, monthlyGoals: prev.monthlyGoals.map((g, i) => i === index ? value : g) }));
    const removeMonthlyGoal = (index) => setGoals(prev => ({ ...prev, monthlyGoals: prev.monthlyGoals.filter((_, i) => i !== index) }));

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-12 px-6 pb-10 animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-4 mb-8"><button onClick={onBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-slate-600 dark:text-white"><ChevronLeft size={20} /></button><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Grote Visie</h2></div>
        <div className="max-w-lg mx-auto space-y-8 pb-20">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">BHAG (Big Hairy Audacious Goal)</h3>
            <InputField label="Wat is je BHAG?" value={goals.bhag} onChange={v => setGoals(prev => ({ ...prev, bhag: v }))} placeholder="Je grote droom..." />
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Jaar doelen</h3>
              <button onClick={addYearlyGoal} className="text-indigo-500 text-sm font-medium">+ Toevoegen</button>
            </div>
            <div className="space-y-3">
              {goals.yearlyGoals.map((goal, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <InputField value={goal} onChange={v => updateYearlyGoal(index, v)} placeholder="Jaar doel..." className="flex-1" />
                  <button onClick={() => removeYearlyGoal(index)} className="text-rose-500 p-2"><X size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Maand doelen</h3>
              <button onClick={addMonthlyGoal} className="text-indigo-500 text-sm font-medium">+ Toevoegen</button>
            </div>
            <div className="space-y-3">
              {goals.monthlyGoals.map((goal, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <InputField value={goal} onChange={v => updateMonthlyGoal(index, v)} placeholder="Maand doel..." className="flex-1" />
                  <button onClick={() => removeMonthlyGoal(index)} className="text-rose-500 p-2"><X size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={() => onSave(goals)} className="w-full">Opslaan</Button>
        </div>
      </div>
    );
  };

  const AnalyticsView = ({ onBack }) => <div className="p-6"><button onClick={onBack}>Terug</button><h2>Data</h2><p>Grafieken hier...</p></div>;
  const HabitList = ({ habits, onToggle, onBack }) => <div className="p-6"><button onClick={onBack}>Terug</button><h2>Habits</h2>{habits.map(h=><div key={h.id} onClick={()=>onToggle(h)}>{h.name}</div>)}</div>;

  if (authChecking) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><div className="w-16 h-16 bg-white rounded-[2rem] animate-pulse shadow-xl" /></div>;
  if (!user) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans"><AuthScreen onLogin={setUser} onError={(msg) => showToast(msg, 'error')} />{toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</div>;
  if (userData.loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-white selection:bg-indigo-500 selection:text-white">
      <div className="max-w-md mx-auto min-h-screen shadow-2xl bg-slate-50 dark:bg-slate-950 relative overflow-hidden flex flex-col border-x border-slate-100 dark:border-slate-900">
        <main className="flex-1 p-6 relative overflow-y-auto scrollbar-hide">
          {view === 'dashboard' && <Dashboard user={user} userData={userData} onNavigate={setView} />}
          {view === 'library' && <LibraryView onBack={() => setView('dashboard')} />}
          {view === 'wins' && <WinsView logs={userData.logs} onBack={() => setView('dashboard')} />}
          {view === 'goals' && <GoalsView initialGoals={userData.goals} onSave={handleSaveGoals} onBack={() => setView('dashboard')} />}
          {view === 'habits' && <HabitList habits={userData.habits} onToggle={handleToggleHabit} onBack={() => setView('dashboard')} />}
          {view === 'insights' && <AnalyticsView logs={userData.logs} onBack={() => setView('dashboard')} />}
        </main>
        {view === 'morning' && <Wizard title="Ochtend" icon={Sun} steps={morningSteps} onComplete={(data) => handleSaveLog(data, 'morning')} onCancel={() => setView('dashboard')} />}
        {view === 'evening' && <Wizard title="Avond" icon={Moon} steps={eveningSteps} onComplete={(data) => handleSaveLog(data, 'evening')} onCancel={() => setView('dashboard')} />}
        {view === 'weekly-goals' && <Wizard title="Week Doelen" icon={Target} steps={weeklyGoalsSteps} onComplete={(data) => handleSaveWeeklyGoals(data)} onCancel={() => setView('dashboard')} />}
        {view === 'weekly-review' && <Wizard title="Week Review" icon={BarChart2} steps={weeklyReviewSteps} onComplete={(data) => handleSaveWeeklyReview(data)} onCancel={() => setView('dashboard')} />}
        {view === 'focus-timer' && <FocusTimer onStart={handleStartFocusSession} onComplete={handleCompleteFocusSession} />}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}
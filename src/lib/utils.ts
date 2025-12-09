import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Goedemorgen, Brein';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedenavond';
};

export const getCurrentQuarter = (): string => {
  const month = new Date().getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return `Q${quarter}`;
};

export const getCurrentMonthName = (): string => {
  return new Date().toLocaleString('nl-NL', { month: 'long' });
};

export const getWeekNumber = (d: Date = new Date()): string => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNo}`;
};

export const isWeekendOrFriday = (): boolean => {
  const day = new Date().getDay();
  return day === 5 || day === 6 || day === 0;
};

export const isFocusDay = (): boolean => {
  const day = new Date().getDay();
  return day === 1 || day === 2 || day === 4; // Mon, Tue, Thu
};

export const getCurrentTime = (): number => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

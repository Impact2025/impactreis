import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { authenticateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString();

    // Get all ritual logs for the period
    const ritualLogs = await sql`
      SELECT type, date_string, data, timestamp
      FROM daily_logs
      WHERE user_id = ${userId}
        AND timestamp > ${cutoffDateStr}::timestamp
      ORDER BY timestamp DESC
    `;

    // Get all wins for the period
    const wins = await sql`
      SELECT id, title, category, impact_level, date, created_at
      FROM wins
      WHERE user_id = ${userId}
        AND created_at > ${cutoffDateStr}::timestamp
      ORDER BY date DESC
    `;

    // Get all goals
    const goals = await sql`
      SELECT * FROM goals
      WHERE user_id = ${userId}
    `;

    // Get focus sessions (wrap in try-catch since table might not exist)
    let focusSessions: any[] = [];
    try {
      focusSessions = await sql`
        SELECT date, start_time, goal, completed, created_at
        FROM focus_sessions
        WHERE user_id = ${userId}
          AND created_at > ${cutoffDateStr}::timestamp
        ORDER BY created_at DESC
      `;
    } catch (e) {
      // Table might not exist, that's okay
      console.log('Focus sessions table not found, skipping');
    }

    // Process morning rituals for energy/sleep data
    const morningData = ritualLogs
      .filter((log: any) => log.type === 'morning')
      .map((log: any) => {
        const data = typeof log.data === 'string' ? JSON.parse(log.data) : log.data;
        return {
          date: log.date_string,
          sleepQuality: data.sleepQuality || data.sleep_quality || 0,
          energyLevel: data.energyLevel || data.energy_level || 0,
          wakeTime: data.wakeTime || data.wake_time || '',
          gratitude: data.gratitude || '',
          top3: data.todayTop3 || data.top3 || [],
        };
      });

    // Process evening rituals
    const eveningData = ritualLogs
      .filter((log: any) => log.type === 'evening')
      .map((log: any) => {
        const data = typeof log.data === 'string' ? JSON.parse(log.data) : log.data;
        return {
          date: log.date_string,
          energyLevel: data.energyLevel || data.energy_level || 0,
          whatWentWell: data.whatWentWell || '',
          biggestWin: data.biggestWin || '',
          learned: data.learned || '',
        };
      });

    // Calculate weekly comparison
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

    const thisWeekMorning = morningData.filter((d: any) => new Date(d.date) >= thisWeekStart);
    const lastWeekMorning = morningData.filter((d: any) => {
      const date = new Date(d.date);
      return date >= lastWeekStart && date <= lastWeekEnd;
    });

    const thisWeekWins = wins.filter((w: any) => new Date(w.date) >= thisWeekStart);
    const lastWeekWins = wins.filter((w: any) => {
      const date = new Date(w.date);
      return date >= lastWeekStart && date <= lastWeekEnd;
    });

    // Calculate averages
    const calcAvg = (arr: any[], key: string) => {
      if (arr.length === 0) return 0;
      const sum = arr.reduce((acc, item) => acc + (item[key] || 0), 0);
      return Math.round((sum / arr.length) * 10) / 10;
    };

    const thisWeekAvgEnergy = calcAvg(thisWeekMorning, 'energyLevel');
    const lastWeekAvgEnergy = calcAvg(lastWeekMorning, 'energyLevel');
    const thisWeekAvgSleep = calcAvg(thisWeekMorning, 'sleepQuality');
    const lastWeekAvgSleep = calcAvg(lastWeekMorning, 'sleepQuality');

    // Calculate streaks and consistency
    const sortedDates = [...new Set(morningData.map((d: any) => d.date))].sort();
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      maxStreak = Math.max(maxStreak, tempStreak);
    }

    // Check if today is part of streak
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (sortedDates.includes(today)) {
      currentStreak = tempStreak;
    } else if (sortedDates.includes(yesterday)) {
      currentStreak = tempStreak;
    }

    // Win categories breakdown
    const winsByCategory = wins.reduce((acc: any, win: any) => {
      acc[win.category] = (acc[win.category] || 0) + 1;
      return acc;
    }, {});

    // Best performing days (by energy)
    const dayPerformance: Record<string, { total: number; count: number }> = {};
    morningData.forEach((d: any) => {
      const dayName = new Date(d.date).toLocaleDateString('nl-NL', { weekday: 'long' });
      if (!dayPerformance[dayName]) {
        dayPerformance[dayName] = { total: 0, count: 0 };
      }
      dayPerformance[dayName].total += d.energyLevel;
      dayPerformance[dayName].count++;
    });

    const bestDays = Object.entries(dayPerformance)
      .map(([day, data]) => ({
        day,
        avgEnergy: Math.round((data.total / data.count) * 10) / 10,
      }))
      .sort((a, b) => b.avgEnergy - a.avgEnergy);

    // Wake time analysis
    const wakeTimes = morningData
      .filter((d: any) => d.wakeTime)
      .map((d: any) => {
        const [hours, minutes] = d.wakeTime.split(':').map(Number);
        return { date: d.date, minutes: hours * 60 + minutes, energy: d.energyLevel };
      });

    const earlyWakeEnergy = wakeTimes.filter((w: any) => w.minutes < 7 * 60);
    const lateWakeEnergy = wakeTimes.filter((w: any) => w.minutes >= 7 * 60);

    const avgEarlyEnergy = calcAvg(earlyWakeEnergy, 'energy');
    const avgLateEnergy = calcAvg(lateWakeEnergy, 'energy');

    // Generate insights
    const insights: string[] = [];

    if (thisWeekAvgEnergy > lastWeekAvgEnergy + 0.5) {
      insights.push(`Je energie is ${(thisWeekAvgEnergy - lastWeekAvgEnergy).toFixed(1)} punten hoger dan vorige week!`);
    } else if (thisWeekAvgEnergy < lastWeekAvgEnergy - 0.5) {
      insights.push(`Let op: je energie is gedaald t.o.v. vorige week. Focus op betere slaap.`);
    }

    if (avgEarlyEnergy > avgLateEnergy + 0.5 && earlyWakeEnergy.length >= 3) {
      insights.push(`Je hebt meer energie op dagen dat je voor 07:00 wakker wordt.`);
    }

    if (bestDays.length > 0 && bestDays[0].avgEnergy > 7) {
      insights.push(`${bestDays[0].day} is je beste dag qua energie (${bestDays[0].avgEnergy} gem.).`);
    }

    if (thisWeekWins.length > lastWeekWins.length) {
      insights.push(`${thisWeekWins.length - lastWeekWins.length} meer wins deze week dan vorige week!`);
    }

    if (currentStreak >= 5) {
      insights.push(`Indrukwekkend! Je hebt al ${currentStreak} dagen op rij je rituelen gedaan.`);
    }

    const topCategory = Object.entries(winsByCategory).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
    if (topCategory && (topCategory[1] as number) >= 3) {
      insights.push(`Je grootste groei zit in ${topCategory[0]} (${topCategory[1]} wins).`);
    }

    return NextResponse.json({
      summary: {
        thisWeek: {
          avgEnergy: thisWeekAvgEnergy,
          avgSleep: thisWeekAvgSleep,
          totalWins: thisWeekWins.length,
          ritualsCompleted: thisWeekMorning.length,
        },
        lastWeek: {
          avgEnergy: lastWeekAvgEnergy,
          avgSleep: lastWeekAvgSleep,
          totalWins: lastWeekWins.length,
          ritualsCompleted: lastWeekMorning.length,
        },
        changes: {
          energy: Math.round((thisWeekAvgEnergy - lastWeekAvgEnergy) * 10) / 10,
          sleep: Math.round((thisWeekAvgSleep - lastWeekAvgSleep) * 10) / 10,
          wins: thisWeekWins.length - lastWeekWins.length,
        },
      },
      streaks: {
        current: currentStreak,
        longest: maxStreak,
        totalDays: sortedDates.length,
      },
      trends: {
        energy: morningData.slice(0, 14).reverse().map((d: any) => ({
          date: d.date,
          value: d.energyLevel,
        })),
        sleep: morningData.slice(0, 14).reverse().map((d: any) => ({
          date: d.date,
          value: d.sleepQuality,
        })),
      },
      wins: {
        total: wins.length,
        byCategory: winsByCategory,
        recent: wins.slice(0, 5),
        avgImpact: calcAvg(wins, 'impact_level'),
      },
      patterns: {
        bestDays,
        wakeTimeImpact: {
          earlyAvgEnergy: avgEarlyEnergy,
          lateAvgEnergy: avgLateEnergy,
        },
      },
      goals: goals,
      focusSessions: {
        total: focusSessions.length,
        completed: focusSessions.filter((s: any) => s.completed).length,
      },
      insights,
      rawData: {
        morning: morningData,
        evening: eveningData,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

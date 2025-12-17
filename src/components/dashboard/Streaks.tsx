import { useState, useEffect } from 'react';
import { Flame, Calendar, Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface UserStreak {
  current_streak: number;
  highest_streak: number;
  last_activity_date: string;
}

interface DailyQuizAttempt {
  attempted_at: string;
  is_correct: boolean;
}

export const Streaks = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [attempts, setAttempts] = useState<DailyQuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreakData();
  }, [user]);

  const loadStreakData = async () => {
    if (!user) return;

    const [streakResult, attemptsResult] = await Promise.all([
      supabase.from('user_streaks').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('daily_quiz_attempts')
        .select('attempted_at, is_correct')
        .eq('user_id', user.id)
        .order('attempted_at', { ascending: false })
        .limit(30),
    ]);

    if (streakResult.data) {
      setStreak(streakResult.data);
    }

    if (attemptsResult.data) {
      setAttempts(attemptsResult.data);
    }

    setLoading(false);
  };

  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const getActivityForDate = (date: string) => {
    return attempts.find((a) => a.attempted_at.split('T')[0] === date);
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Streaks</h1>
          <p className="text-gray-600">Stay consistent and watch your streak grow!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Flame className="w-12 h-12" />
              <div className="text-5xl font-bold">{streak?.current_streak || 0}</div>
            </div>
            <div className="text-lg font-medium">Current Streak</div>
            <p className="text-sm opacity-90 mt-2">Keep it going!</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-12 h-12" />
              <div className="text-5xl font-bold">{streak?.highest_streak || 0}</div>
            </div>
            <div className="text-lg font-medium">Highest Streak</div>
            <p className="text-sm opacity-90 mt-2">Personal best</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-12 h-12" />
              <div className="text-5xl font-bold">{attempts.length}</div>
            </div>
            <div className="text-lg font-medium">Total Quizzes</div>
            <p className="text-sm opacity-90 mt-2">All time</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Activity Calendar</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">Last 30 days of activity</p>

          <div className="grid grid-cols-10 gap-2">
            {getLast30Days().map((date) => {
              const activity = getActivityForDate(date);
              const dayOfMonth = new Date(date).getDate();

              return (
                <div key={date} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition ${
                      activity
                        ? activity.is_correct
                          ? 'bg-green-500 text-white'
                          : 'bg-red-400 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                    title={date}
                  >
                    {dayOfMonth}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-600">Correct</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-400 rounded"></div>
              <span className="text-gray-600">Incorrect</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-gray-600">No activity</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-3">
            {attempts.slice(0, 10).map((attempt, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  {attempt.is_correct ? (
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Flame className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Flame className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">
                      {attempt.is_correct ? 'Correct Answer' : 'Incorrect Answer'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(attempt.attempted_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    attempt.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {attempt.is_correct ? 'Streak +1' : 'Streak Reset'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

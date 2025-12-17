import { useState, useEffect } from 'react';
import { Calendar, Flame, Trophy, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DailyQuiz {
  id: number;
  quiz_date: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface UserStreak {
  current_streak: number;
  highest_streak: number;
  last_activity_date: string;
}

interface QuizAttempt {
  user_answer: string;
  is_correct: boolean;
}

export const DailyQuiz = () => {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<DailyQuiz | null>(null);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizData();
  }, [user]);

  const loadQuizData = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const [quizResult, streakResult, attemptResult] = await Promise.all([
      supabase
        .from('daily_quizzes')
        .select('*')
        .eq('quiz_date', today)
        .eq('is_active', true)
        .maybeSingle(),
      supabase.from('user_streaks').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('daily_quiz_attempts')
        .select('user_answer, is_correct')
        .eq('user_id', user.id)
        .order('attempted_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (quizResult.data) {
      setQuiz(quizResult.data);
    }

    if (streakResult.data) {
      setStreak(streakResult.data);
    } else {
      const { data } = await supabase
        .from('user_streaks')
        .insert({
          user_id: user.id,
          current_streak: 0,
          highest_streak: 0,
        })
        .select()
        .single();
      if (data) setStreak(data);
    }

    if (attemptResult.data) {
      setAttempt(attemptResult.data);
      setSelectedAnswer(attemptResult.data.user_answer);
      setShowResult(true);
    }

    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !quiz || !selectedAnswer) return;

    const isCorrect = selectedAnswer === quiz.correct_answer;

    const { error } = await supabase.from('daily_quiz_attempts').insert({
      user_id: user.id,
      daily_quiz_id: quiz.id,
      user_answer: selectedAnswer,
      is_correct: isCorrect,
    });

    if (!error) {
      const newCurrentStreak = isCorrect ? (streak?.current_streak || 0) + 1 : 0;
      const newHighestStreak = Math.max(newCurrentStreak, streak?.highest_streak || 0);

      await supabase
        .from('user_streaks')
        .update({
          current_streak: newCurrentStreak,
          highest_streak: newHighestStreak,
          last_activity_date: new Date().toISOString().split('T')[0],
        })
        .eq('user_id', user.id);

      setAttempt({ user_answer: selectedAnswer, is_correct: isCorrect });
      setStreak({
        current_streak: newCurrentStreak,
        highest_streak: newHighestStreak,
        last_activity_date: new Date().toISOString().split('T')[0],
      });
      setShowResult(true);
    }
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Quiz</h1>
          <p className="text-gray-600">Answer one question daily to build your streak!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Flame className="w-10 h-10" />
              <div className="text-3xl font-bold">{streak?.current_streak || 0}</div>
            </div>
            <div className="text-sm opacity-90">Current Streak</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-10 h-10" />
              <div className="text-3xl font-bold">{streak?.highest_streak || 0}</div>
            </div>
            <div className="text-sm opacity-90">Highest Streak</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-10 h-10" />
              <div className="text-3xl font-bold">{new Date().getDate()}</div>
            </div>
            <div className="text-sm opacity-90">Day of Month</div>
          </div>
        </div>

        {quiz ? (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                Today's Question
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{quiz.question_text}</h2>
            </div>

            <div className="space-y-3 mb-6">
              {quiz.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === quiz.correct_answer;
                const showCorrect = showResult && isCorrect;
                const showWrong = showResult && isSelected && !isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() => !showResult && setSelectedAnswer(option)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-lg border-2 text-left transition flex items-center justify-between ${
                      showCorrect
                        ? 'border-green-500 bg-green-50'
                        : showWrong
                        ? 'border-red-500 bg-red-50'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300 bg-white'
                    } ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className="font-medium">{option}</span>
                    {showCorrect && <CheckCircle className="w-6 h-6 text-green-600" />}
                    {showWrong && <XCircle className="w-6 h-6 text-red-600" />}
                  </button>
                );
              })}
            </div>

            {showResult && (
              <div
                className={`p-4 rounded-lg mb-6 ${
                  attempt?.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className={`font-semibold mb-2 ${attempt?.is_correct ? 'text-green-800' : 'text-red-800'}`}>
                  {attempt?.is_correct ? 'Correct!' : 'Incorrect'}
                </div>
                <div className="text-gray-700">{quiz.explanation}</div>
              </div>
            )}

            {!showResult && (
              <button
                onClick={handleSubmit}
                disabled={!selectedAnswer}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            )}

            {showResult && (
              <div className="text-center text-gray-600">
                Come back tomorrow for the next question!
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-gray-500 mb-4">No quiz available for today</div>
            <p className="text-sm text-gray-400">Check back tomorrow for a new question!</p>
          </div>
        )}
      </div>
    </div>
  );
};

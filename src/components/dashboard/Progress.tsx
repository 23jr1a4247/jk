import { useState, useEffect } from 'react';
import { TrendingUp, Award, Target, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Level {
  id: number;
  level_number: number;
  title: string;
  description: string;
}

interface Module {
  id: number;
  level_id: number;
  module_number: number;
  title: string;
}

interface ModuleProgress {
  module_id: number;
  completed: number;
  total: number;
  percentage: number;
}

export const Progress = () => {
  const { user } = useAuth();
  const [levels, setLevels] = useState<Level[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Map<number, ModuleProgress>>(new Map());
  const [overallProgress, setOverallProgress] = useState(0);
  const [completedModules, setCompletedModules] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, [user]);

  const loadProgressData = async () => {
    if (!user) return;

    const [levelsResult, modulesResult, subModulesResult, progressResult] = await Promise.all([
      supabase.from('levels').select('*').eq('is_active', true).order('level_number'),
      supabase.from('modules').select('*').eq('is_active', true).order('module_number'),
      supabase.from('sub_modules').select('module_id, id'),
      supabase.from('user_progress').select('module_id, sub_module_id, is_completed').eq('user_id', user.id),
    ]);

    if (levelsResult.data) setLevels(levelsResult.data);
    if (modulesResult.data) setModules(modulesResult.data);

    if (subModulesResult.data && progressResult.data) {
      const moduleSubModules = new Map<number, number>();
      subModulesResult.data.forEach((sm) => {
        moduleSubModules.set(sm.module_id, (moduleSubModules.get(sm.module_id) || 0) + 1);
      });

      const moduleCompleted = new Map<number, number>();
      progressResult.data.forEach((p) => {
        if (p.is_completed && p.sub_module_id) {
          moduleCompleted.set(p.module_id, (moduleCompleted.get(p.module_id) || 0) + 1);
        }
      });

      const progressMap = new Map<number, ModuleProgress>();
      let totalCompleted = 0;
      let modulesCompleted = 0;

      moduleSubModules.forEach((total, moduleId) => {
        const completed = moduleCompleted.get(moduleId) || 0;
        const percentage = Math.round((completed / total) * 100);

        progressMap.set(moduleId, {
          module_id: moduleId,
          completed,
          total,
          percentage,
        });

        totalCompleted += completed;
        if (percentage === 100) modulesCompleted++;
      });

      const totalSubModules = Array.from(moduleSubModules.values()).reduce((a, b) => a + b, 0);
      const overallPercentage = totalSubModules > 0 ? Math.round((totalCompleted / totalSubModules) * 100) : 0;

      setProgress(progressMap);
      setOverallProgress(overallPercentage);
      setCompletedModules(modulesCompleted);
    }

    setLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h1>
          <p className="text-gray-600">Track your learning journey and achievements</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div className="text-3xl font-bold text-gray-900">{overallProgress}%</div>
            </div>
            <div className="text-sm text-gray-600">Overall Progress</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 text-green-600" />
              <div className="text-3xl font-bold text-gray-900">{completedModules}</div>
            </div>
            <div className="text-sm text-gray-600">Modules Completed</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-purple-600" />
              <div className="text-3xl font-bold text-gray-900">{modules.length - completedModules}</div>
            </div>
            <div className="text-sm text-gray-600">Modules Remaining</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="text-3xl font-bold text-gray-900">{modules.length}</div>
            </div>
            <div className="text-sm text-gray-600">Total Modules</div>
          </div>
        </div>

        <div className="space-y-6">
          {levels.map((level) => {
            const levelModules = modules.filter((m) => m.level_id === level.id);
            const levelProgress = levelModules.map((m) => progress.get(m.id)?.percentage || 0);
            const levelPercentage =
              levelProgress.length > 0 ? Math.round(levelProgress.reduce((a, b) => a + b, 0) / levelProgress.length) : 0;

            return (
              <div key={level.id} className="bg-white rounded-xl shadow p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      Level {level.level_number}: {level.title}
                    </h2>
                    <span className="text-sm font-semibold text-blue-600">{levelPercentage}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{level.description}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${levelPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {levelModules.map((module) => {
                    const moduleProgress = progress.get(module.id);
                    const percentage = moduleProgress?.percentage || 0;

                    return (
                      <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                percentage === 100 ? 'bg-green-500' : percentage > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                              }`}
                            />
                            <span className="font-medium text-gray-900">
                              Module {module.module_number}: {module.title}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{percentage}%</span>
                        </div>
                        <div className="ml-6">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="text-sm text-gray-600">
                              {moduleProgress?.completed || 0} / {moduleProgress?.total || 0} sub-modules completed
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

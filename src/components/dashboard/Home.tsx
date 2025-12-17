import { useState, useEffect } from 'react';
import { Search, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Module {
  id: number;
  title: string;
  description: string;
  module_number: number;
  level_id: number;
}

interface UserProgress {
  module_id: number;
  completed_count: number;
  total_count: number;
  percentage: number;
}

interface UserProfile {
  first_name: string;
  last_name: string;
}

export const Home = ({ onModuleClick }: { onModuleClick: (moduleId: number) => void }) => {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Map<number, UserProgress>>(new Map());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [profileResult, modulesResult, subModulesResult, progressResult] = await Promise.all([
      supabase.from('user_profiles').select('first_name, last_name').eq('id', user.id).maybeSingle(),
      supabase.from('modules').select('*').eq('is_active', true).order('module_number'),
      supabase.from('sub_modules').select('module_id, id'),
      supabase.from('user_progress').select('module_id, is_completed').eq('user_id', user.id),
    ]);

    if (profileResult.data) {
      setUserProfile(profileResult.data);
    }

    if (modulesResult.data) {
      setModules(modulesResult.data);
    }

    if (subModulesResult.data && progressResult.data) {
      const moduleSubModuleCount = new Map<number, number>();
      subModulesResult.data.forEach((sm) => {
        moduleSubModuleCount.set(sm.module_id, (moduleSubModuleCount.get(sm.module_id) || 0) + 1);
      });

      const moduleProgressCount = new Map<number, number>();
      progressResult.data.forEach((p) => {
        if (p.is_completed) {
          moduleProgressCount.set(p.module_id, (moduleProgressCount.get(p.module_id) || 0) + 1);
        }
      });

      const progressMap = new Map<number, UserProgress>();
      moduleSubModuleCount.forEach((total, moduleId) => {
        const completed = moduleProgressCount.get(moduleId) || 0;
        progressMap.set(moduleId, {
          module_id: moduleId,
          completed_count: completed,
          total_count: total,
          percentage: Math.round((completed / total) * 100),
        });
      });

      setProgress(progressMap);
    }

    setLoading(false);
  };

  const filteredModules = modules.filter(
    (module) =>
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredModules = filteredModules.slice(0, 8);
  const slidesToShow = 4;
  const maxSlide = Math.max(0, featuredModules.length - slidesToShow);

  const nextSlide = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, maxSlide));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const getModuleColor = (index: number) => {
    const colors = [
      'from-green-400 to-green-500',
      'from-orange-400 to-orange-500',
      'from-blue-400 to-blue-500',
      'from-pink-400 to-pink-500',
      'from-cyan-400 to-cyan-500',
      'from-yellow-400 to-yellow-500',
      'from-teal-400 to-teal-500',
      'from-red-400 to-red-500',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lessons, tenses, or rules..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-8">
            <span className="text-gray-600">
              Welcome, <span className="font-semibold">{userProfile?.first_name || 'User'}</span>
            </span>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {userProfile?.first_name?.[0] || 'U'}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Featured</h2>
            <div className="flex gap-2">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="p-2 bg-white rounded-full shadow hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                disabled={currentSlide >= maxSlide}
                className="p-2 bg-white rounded-full shadow hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden">
            <div
              className="flex gap-6 transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * (100 / slidesToShow)}%)` }}
            >
              {featuredModules.map((module, index) => {
                const moduleProgress = progress.get(module.id);
                const percentage = moduleProgress?.percentage || 0;

                return (
                  <div
                    key={module.id}
                    className="flex-shrink-0 w-72"
                  >
                    <div
                      className={`bg-gradient-to-br ${getModuleColor(
                        index
                      )} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition cursor-pointer h-64 flex flex-col justify-between`}
                      onClick={() => onModuleClick(module.id)}
                    >
                      <div>
                        <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mb-4">
                          Module {module.module_number}
                        </div>
                        <h3 className="text-xl font-bold mb-2">{module.title}</h3>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">
                            {moduleProgress?.total_count || 0}
                          </span>
                          <span className="text-sm opacity-80">items</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-900 mb-2 hover:scale-110 transition">
                            <Play className="w-6 h-6 ml-1" />
                          </div>
                          <span className="text-sm font-semibold">{percentage}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module, index) => {
              const moduleProgress = progress.get(module.id);
              const percentage = moduleProgress?.percentage || 0;

              return (
                <div
                  key={module.id}
                  onClick={() => onModuleClick(module.id)}
                  className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition cursor-pointer border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Module {module.module_number}</div>
                      <h3 className="text-lg font-bold text-gray-900">{module.title}</h3>
                    </div>
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getModuleColor(index)} flex items-center justify-center`}>
                      <Play className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{module.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {moduleProgress?.completed_count || 0} / {moduleProgress?.total_count || 0} completed
                    </div>
                    <div className="text-sm font-semibold text-blue-600">{percentage}%</div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

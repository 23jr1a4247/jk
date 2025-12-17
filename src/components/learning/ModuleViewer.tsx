import { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle2, Lock, Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Module {
  id: number;
  title: string;
  description: string;
  module_number: number;
}

interface SubModule {
  id: number;
  title: string;
  description: string;
  sub_module_number: number;
}

interface MicroConcept {
  id: number;
  title: string;
  definition_simple: string;
  definition_formal: string;
  why_exists: string;
  cognitive_explanation: string;
  examples: string[];
}

interface UserProgress {
  is_completed: boolean;
}

export const ModuleViewer = ({
  moduleId,
  onBack,
}: {
  moduleId: number;
  onBack: () => void;
}) => {
  const { user } = useAuth();
  const [module, setModule] = useState<Module | null>(null);
  const [subModules, setSubModules] = useState<SubModule[]>([]);
  const [selectedSubModule, setSelectedSubModule] = useState<SubModule | null>(null);
  const [concepts, setConcepts] = useState<MicroConcept[]>([]);
  const [progress, setProgress] = useState<Map<number, UserProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModuleData();
  }, [moduleId, user]);

  const loadModuleData = async () => {
    if (!user) return;

    const [moduleResult, subModulesResult, progressResult] = await Promise.all([
      supabase.from('modules').select('*').eq('id', moduleId).single(),
      supabase.from('sub_modules').select('*').eq('module_id', moduleId).order('sub_module_number'),
      supabase.from('user_progress').select('*').eq('user_id', user.id).eq('module_id', moduleId),
    ]);

    if (moduleResult.data) {
      setModule(moduleResult.data);
    }

    if (subModulesResult.data) {
      setSubModules(subModulesResult.data);
      if (subModulesResult.data.length > 0) {
        setSelectedSubModule(subModulesResult.data[0]);
      }
    }

    if (progressResult.data) {
      const progressMap = new Map<number, UserProgress>();
      progressResult.data.forEach((p) => {
        progressMap.set(p.sub_module_id, { is_completed: p.is_completed });
      });
      setProgress(progressMap);
    }

    setLoading(false);
  };

  const loadSubModuleContent = async (subModuleId: number) => {
    const { data } = await supabase
      .from('micro_concepts')
      .select('*')
      .eq('sub_module_id', subModuleId)
      .order('concept_number');

    if (data) {
      setConcepts(data);
    }
  };

  const handleSubModuleClick = (subModule: SubModule) => {
    setSelectedSubModule(subModule);
    loadSubModuleContent(subModule.id);
  };

  const markSubModuleComplete = async (subModuleId: number) => {
    if (!user || !module) return;

    const { error } = await supabase.from('user_progress').upsert({
      user_id: user.id,
      module_id: module.id,
      sub_module_id: subModuleId,
      is_completed: true,
      completed_at: new Date().toISOString(),
    });

    if (!error) {
      setProgress(new Map(progress).set(subModuleId, { is_completed: true }));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const isSubModuleUnlocked = (subModule: SubModule) => {
    if (subModule.unlock_after_sub_module === null) return true;
    return progress.get(subModule.unlock_after_sub_module)?.is_completed === true;
  };

  const isSubModuleCompleted = (subModuleId: number) => {
    return progress.get(subModuleId)?.is_completed === true;
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden">
      <div className="flex h-full">
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 border-b border-gray-200">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
            <h2 className="text-lg font-bold text-gray-900">{module?.title}</h2>
          </div>

          <nav className="p-4 space-y-2">
            {subModules.map((subModule) => {
              const unlocked = isSubModuleUnlocked(subModule);
              const completed = isSubModuleCompleted(subModule.id);
              const isSelected = selectedSubModule?.id === subModule.id;

              return (
                <button
                  key={subModule.id}
                  onClick={() => unlocked && handleSubModuleClick(subModule)}
                  disabled={!unlocked}
                  className={`w-full text-left p-3 rounded-lg transition flex items-start gap-3 ${
                    isSelected
                      ? 'bg-blue-100 border border-blue-300'
                      : unlocked
                      ? 'hover:bg-gray-100 border border-transparent'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="mt-1">
                    {completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : unlocked ? (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-gray-900">{subModule.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{subModule.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedSubModule ? (
            <div className="p-8 max-w-4xl">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedSubModule.title}</h1>
                <p className="text-gray-600">{selectedSubModule.description}</p>
              </div>

              {concepts.length > 0 ? (
                <div className="space-y-6 mb-8">
                  {concepts.map((concept) => (
                    <div key={concept.id} className="bg-white rounded-lg p-6 border border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">{concept.title}</h2>

                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Definition</h3>
                          <p className="text-gray-700 mb-2">{concept.definition_simple}</p>
                          <p className="text-sm text-gray-600 italic">{concept.definition_formal}</p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Why This Matters</h3>
                          <p className="text-gray-700">{concept.why_exists}</p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">How to Understand It</h3>
                          <p className="text-gray-700">{concept.cognitive_explanation}</p>
                        </div>

                        {concept.examples && concept.examples.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Examples</h3>
                            <ul className="space-y-2">
                              {concept.examples.map((example, idx) => (
                                <li key={idx} className="text-gray-700 flex items-start gap-2">
                                  <span className="text-blue-600 mt-1">•</span>
                                  <span>{example}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                  <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Click on a sub-module to start learning</p>
                </div>
              )}

              {concepts.length > 0 && (
                <button
                  onClick={() => markSubModuleComplete(selectedSubModule.id)}
                  disabled={isSubModuleCompleted(selectedSubModule.id)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubModuleCompleted(selectedSubModule.id) ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Completed
                    </>
                  ) : (
                    'Mark as Complete'
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-center">
                <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a sub-module to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

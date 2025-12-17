import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { Sidebar } from './components/dashboard/Sidebar';
import { Home } from './components/dashboard/Home';
import { DailyQuiz } from './components/dashboard/DailyQuiz';
import { Progress } from './components/dashboard/Progress';
import { Streaks } from './components/dashboard/Streaks';
import { Profile } from './components/dashboard/Profile';
import { ModuleViewer } from './components/learning/ModuleViewer';

type AuthPage = 'login' | 'signup' | 'forgot-password';
type DashboardTab = 'home' | 'streaks' | 'quiz' | 'progress' | 'profile';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-700 text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (authPage === 'signup') {
      return <Signup onSwitchToLogin={() => setAuthPage('login')} />;
    }
    if (authPage === 'forgot-password') {
      return <ForgotPassword onSwitchToLogin={() => setAuthPage('login')} />;
    }
    return (
      <Login
        onSwitchToSignup={() => setAuthPage('signup')}
        onSwitchToForgotPassword={() => setAuthPage('forgot-password')}
      />
    );
  }

  const handleLogout = async () => {
    await signOut();
  };

  if (selectedModuleId) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
        <ModuleViewer moduleId={selectedModuleId} onBack={() => setSelectedModuleId(null)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      {activeTab === 'home' && <Home onModuleClick={setSelectedModuleId} />}
      {activeTab === 'streaks' && <Streaks />}
      {activeTab === 'quiz' && <DailyQuiz />}
      {activeTab === 'progress' && <Progress />}
      {activeTab === 'profile' && <Profile />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

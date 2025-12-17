import { Home, Flame, HelpCircle, TrendingUp, Brain, LogOut, User } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar = ({ activeTab, onTabChange, onLogout }: SidebarProps) => {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'streaks', label: 'Streaks', icon: Flame },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const comingSoonItems = [
    { id: 'reasoning', label: 'Reasoning & Aptitude', icon: Brain },
  ];

  return (
    <div className="w-60 bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <span className="text-2xl">📚</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">JK English</h1>
            <p className="text-blue-200 text-sm">Hub</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === item.id
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-100 hover:bg-blue-700/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8">
          <h3 className="text-blue-300 text-xs font-semibold uppercase px-4 mb-2">
            Coming Soon
          </h3>
          {comingSoonItems.map((item) => (
            <button
              key={item.id}
              disabled
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-300 opacity-60 cursor-not-allowed"
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto p-6">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-700/50 transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

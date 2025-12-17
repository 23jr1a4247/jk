import { useState, useEffect } from 'react';
import { User, Mail, Phone, Award, Calendar, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfile {
  first_name: string;
  last_name: string;
  roll_number: string | null;
  mobile_number: string | null;
  current_level: number;
  total_xp: number;
  created_at: string;
}

interface UserAchievement {
  achievements: {
    title: string;
    description: string;
    badge_icon: string;
  };
  earned_at: string;
}

export const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    mobile_number: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    const [profileResult, achievementsResult] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('user_achievements')
        .select('achievements(title, description, badge_icon), earned_at')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false }),
    ]);

    if (profileResult.data) {
      setProfile(profileResult.data);
      setFormData({
        first_name: profileResult.data.first_name,
        last_name: profileResult.data.last_name,
        mobile_number: profileResult.data.mobile_number || '',
      });
    }

    if (achievementsResult.data) {
      setAchievements(achievementsResult.data as UserAchievement[]);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    const { error } = await supabase
      .from('user_profiles')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        mobile_number: formData.mobile_number || null,
      })
      .eq('id', user.id);

    if (!error) {
      await loadProfileData();
      setEditing(false);
    }

    setSaving(false);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
          <p className="text-gray-600">Manage your account information and view achievements</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                {profile?.first_name[0]}{profile?.last_name[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile?.first_name} {profile?.last_name}
                </h2>
                <p className="text-gray-600">{user?.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    Level {profile?.current_level}
                  </div>
                  <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                    {profile?.total_xp} XP
                  </div>
                </div>
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-900">
                    <User className="w-4 h-4 text-gray-400" />
                    {profile?.first_name}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-900">
                    <User className="w-4 h-4 text-gray-400" />
                    {profile?.last_name}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {user?.email}
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-900">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {profile?.mobile_number || 'Not provided'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Award className="w-4 h-4 text-gray-400" />
                  {profile?.roll_number || 'Not provided'}
                </div>
                <p className="text-xs text-gray-500 mt-1">Roll number cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(profile?.created_at || '').toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            {editing && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      first_name: profile?.first_name || '',
                      last_name: profile?.last_name || '',
                      mobile_number: profile?.mobile_number || '',
                    });
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Achievements</h3>
          {achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 flex items-start gap-4">
                  <div className="text-4xl">{achievement.achievements.badge_icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{achievement.achievements.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{achievement.achievements.description}</p>
                    <p className="text-xs text-gray-500">
                      Earned on {new Date(achievement.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No achievements yet. Keep learning to earn badges!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

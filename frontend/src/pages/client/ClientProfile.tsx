import React, { useEffect, useState } from 'react';
import { UserResponseDTO, UserRequestDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { User, Mail, Phone, Camera, ShieldCheck, Calendar, Lock, LogOut, ChevronRight, Save, X, Loader2 } from 'lucide-react';

const ClientProfile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<UserResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    userApi.getClientProfile(currentUser.id)
      .then((data: UserResponseDTO) => {
        setProfile(data);
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber || ''
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSaving(true);
    try {
      const updated = await userApi.updateProfile(profile.id, formData);
      setProfile(updated);
      setIsEditing(false);
      addToast('Profile updated successfully', 'success');
    } catch(err: any) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading your profile...</p>
      </div>
    );
  }

  if (!profile) return (
    <div className="finova-card p-12 text-center">
      <p className="text-rose-500 font-bold">Profile not found.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-500 mt-1">Manage your personal information and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Avatar & Quick Info */}
        <div className="space-y-6">
          <div className="finova-card p-8 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-4xl font-bold shadow-xl shadow-indigo-200 overflow-hidden">
                {profile.profilePictureUrl ? (
                  <img src={profile.profilePictureUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  `${profile.firstName[0]}${profile.lastName[0]}`
                )}
              </div>
              <button className="absolute -bottom-2 -right-2 p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-600 shadow-lg transition-all active:scale-95">
                <Camera size={18} />
              </button>
            </div>
            <h3 className="mt-6 text-xl font-bold text-slate-900">{profile.firstName} {profile.lastName}</h3>
            <p className="text-sm text-slate-500 mt-1">{profile.email}</p>
            <div className={`mt-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${profile.kycVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {profile.kycVerified ? '✓ Verified Account' : 'Verification Pending'}
            </div>
          </div>

          <div className="finova-card p-0 overflow-hidden">
            <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all"><Lock size={18} /></div>
                <span className="text-sm font-bold text-slate-700">Change Password</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
            <button 
              onClick={() => logout()}
              className="w-full p-4 flex items-center justify-between hover:bg-rose-50 transition-all group border-t border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-rose-100 group-hover:text-rose-600 transition-all"><LogOut size={18} /></div>
                <span className="text-sm font-bold text-slate-700 group-hover:text-rose-600">Logout</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          </div>
        </div>

        {/* Right Column - Main Form */}
        <div className="lg:col-span-2">
          <div className="finova-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900">Personal Information</h3>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95 text-sm"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all"
                      value={formData.firstName} 
                      onChange={e => setFormData({...formData, firstName: e.target.value})} 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all"
                      value={formData.lastName} 
                      onChange={e => setFormData({...formData, lastName: e.target.value})} 
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input 
                    type="tel"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all"
                    value={formData.phoneNumber} 
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                    placeholder="+216 -- --- ---"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-50">Email Address (Read Only)</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 font-medium cursor-not-allowed"
                    value={profile.email} 
                    disabled
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <X size={18} /> Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Changes</>}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><User size={20} /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">{profile.firstName} {profile.lastName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Mail size={20} /></div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                      <p className="text-lg font-bold text-slate-900 mt-1 truncate">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Phone size={20} /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">{profile.phoneNumber || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Calendar size={20} /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Joined Date</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">{new Date(profile.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Account Verification Section */}
                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${profile.kycVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'} shrink-0`}>
                    <ShieldCheck size={32} />
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h4 className="font-bold text-slate-900">Identity Verification (KYC)</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      {profile.kycVerified 
                        ? 'Your account is fully verified. You have access to all Finova features and limits.' 
                        : 'Please complete your identity verification to unlock higher loan limits and premium features.'}
                    </p>
                  </div>
                  {!profile.kycVerified && (
                    <button className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100 whitespace-nowrap">
                      Start KYC
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;

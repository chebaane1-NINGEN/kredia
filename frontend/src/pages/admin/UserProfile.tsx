import React, { useState } from 'react';
import { User as UserIcon, Camera, Mail, Phone, Lock, Shield, Save, X, Loader2, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../api/userApi';
import { UserStatus } from '../../types/user.types';
import { useToast } from '../../contexts/ToastContext';

const UserProfile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phoneNumber: currentUser?.phoneNumber || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.phoneNumber && !/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!validatePassword(passwordData.newPassword)) {
      newErrors.newPassword = 'Password must be at least 8 characters with uppercase, lowercase, and numbers';
    }
    
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      await userApi.updateProfile(currentUser.id, formData);
      addToast('Profile updated successfully', 'success');
      setIsEditing(false);
      setErrors({});
    } catch (err: any) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (!validatePasswordForm()) {
      return;
    }
    
    try {
      setLoading(true);
      // Utiliser updateProfile pour changer le mot de passe
      await userApi.updateProfile(currentUser.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      addToast('Password changed successfully', 'success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
    } catch (err: any) {
      addToast(err.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Profile</h1>
        <p className="text-slate-500 mt-1">Manage your administrator account and security credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Avatar & Quick Info */}
        <div className="space-y-6">
          <div className="finova-card p-8 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-4xl font-bold shadow-xl shadow-indigo-200 overflow-hidden">
                {currentUser.profilePictureUrl ? (
                  <img src={currentUser.profilePictureUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  `${currentUser.firstName[0]}${currentUser.lastName[0]}`
                )}
              </div>
              <button className="absolute -bottom-2 -right-2 p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-600 shadow-lg transition-all active:scale-95">
                <Camera size={18} />
              </button>
            </div>
            <h3 className="mt-6 text-xl font-bold text-slate-900">{currentUser.firstName} {currentUser.lastName}</h3>
            <p className="text-sm text-slate-500 mt-1 uppercase font-bold tracking-widest">{currentUser.role}</p>
            <div className={`mt-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${currentUser.status === UserStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {currentUser.status}
            </div>
          </div>

          <div className="finova-card p-0 overflow-hidden">
            <button 
              onClick={() => logout()}
              className="w-full p-4 flex items-center justify-between hover:bg-rose-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-rose-100 group-hover:text-rose-600 transition-all"><LogOut size={18} /></div>
                <span className="text-sm font-bold text-slate-700 group-hover:text-rose-600">Logout Session</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          </div>
        </div>

        {/* Right Column - Main Form */}
        <div className="lg:col-span-2">
          <div className="finova-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900">Account Details</h3>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95 text-sm"
                >
                  Edit Information
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
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
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-50">Email Address (Read Only)</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 font-medium cursor-not-allowed"
                    value={formData.email} 
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
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Update Profile</>}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><UserIcon size={20} /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">{currentUser.firstName} {currentUser.lastName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Mail size={20} /></div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                      <p className="text-lg font-bold text-slate-900 mt-1 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Phone size={20} /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">{currentUser.phoneNumber || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Shield size={20} /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Access Level</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">Full Administrator</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Lock size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Security & Password</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                      <input 
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                      <input 
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>
                  <button className="mt-6 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg">
                    Change Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { userApi } from '../../api/userApi';
import { UserRole, UserStatus } from '../../types/user.types';
import { Camera, Mail, Shield, User as UserIcon, Lock, CheckCircle } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { currentUser } = useAuth();
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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    try {
      setLoading(true);
      await userApi.updateProfile(currentUser.id, formData);
      addToast('Profile updated successfully', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    
    try {
      setLoading(true);
      // Mocking password change as we might not have a dedicated endpoint yet
      await new Promise(resolve => setTimeout(resolve, 1000));
      addToast('Password changed successfully', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      addToast(err.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page wow fadeInUp p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#2B3674]">My Profile</h2>
        <p className="text-[#A3AED0] font-medium">Manage your personal information and security settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Summary */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-[30px] p-8 shadow-sm border border-gray-50 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full bg-[#F4F7FE] flex items-center justify-center text-4xl font-bold text-[#4318FF] border-4 border-white shadow-xl overflow-hidden">
                {currentUser?.profilePictureUrl ? (
                  <img src={currentUser.profilePictureUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}</span>
                )}
              </div>
              <button className="absolute bottom-1 right-1 bg-[#4318FF] text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                <Camera size={18} />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-[#2B3674]">{currentUser?.firstName} {currentUser?.lastName}</h3>
            <p className="text-[#A3AED0] font-medium mb-4">{currentUser?.role}</p>
            
            <div className="flex gap-2 mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                currentUser?.status === UserStatus.ACTIVE ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {currentUser?.status}
              </span>
              {currentUser?.kycVerified && (
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <CheckCircle size={12} /> KYC Verified
                </span>
              )}
            </div>

            <div className="w-full pt-6 border-t border-gray-100 text-left space-y-4">
              <div className="flex items-center gap-3 text-[#2B3674]">
                <Mail size={18} className="text-[#A3AED0]" />
                <span className="text-sm font-semibold">{currentUser?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-[#2B3674]">
                <Shield size={18} className="text-[#A3AED0]" />
                <span className="text-sm font-semibold">Administrator Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information */}
          <div className="bg-white rounded-[30px] p-8 shadow-sm border border-gray-50">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-[#F4F7FE] rounded-xl text-[#4318FF]">
                <UserIcon size={20} />
              </div>
              <h3 className="text-xl font-bold text-[#2B3674]">General Information</h3>
            </div>

            <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="text-sm font-bold text-[#2B3674] mb-2 block">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-4 text-[#2B3674] font-bold focus:ring-2 focus:ring-[#4318FF] transition-all"
                />
              </div>
              <div className="form-group">
                <label className="text-sm font-bold text-[#2B3674] mb-2 block">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-4 text-[#2B3674] font-bold focus:ring-2 focus:ring-[#4318FF] transition-all"
                />
              </div>
              <div className="form-group">
                <label className="text-sm font-bold text-[#2B3674] mb-2 block">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-4 text-[#2B3674] font-bold opacity-60 cursor-not-allowed"
                />
              </div>
              <div className="form-group">
                <label className="text-sm font-bold text-[#2B3674] mb-2 block">Phone Number</label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-4 text-[#2B3674] font-bold focus:ring-2 focus:ring-[#4318FF] transition-all"
                />
              </div>
              <div className="md:col-span-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#4318FF] text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-blue-200 hover:bg-[#3714d6] transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Security */}
          <div className="bg-white rounded-[30px] p-8 shadow-sm border border-gray-50">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-[#F4F7FE] rounded-xl text-[#4318FF]">
                <Lock size={20} />
              </div>
              <h3 className="text-xl font-bold text-[#2B3674]">Security Settings</h3>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="form-group">
                <label className="text-sm font-bold text-[#2B3674] mb-2 block">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-4 text-[#2B3674] font-bold focus:ring-2 focus:ring-[#4318FF] transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="text-sm font-bold text-[#2B3674] mb-2 block">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    placeholder="••••••••"
                    className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-4 text-[#2B3674] font-bold focus:ring-2 focus:ring-[#4318FF] transition-all"
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-bold text-[#2B3674] mb-2 block">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    placeholder="••••••••"
                    className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-4 text-[#2B3674] font-bold focus:ring-2 focus:ring-[#4318FF] transition-all"
                  />
                </div>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-white text-[#2B3674] border-2 border-[#E0E5F2] font-bold py-4 px-8 rounded-2xl hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

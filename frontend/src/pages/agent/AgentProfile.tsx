import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  Edit2,
  Save,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Calendar,
  MapPin,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { UserRole } from '../../types/user.types';

interface AgentProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  dateOfBirth: string;
  address: string;
  createdAt: string;
  lastLogin: string;
}

const AgentProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [passwordEditing, setPasswordEditing] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Simuler les données du profil agent
      const mockProfile: AgentProfile = {
        id: currentUser?.id || 6,
        firstName: currentUser?.firstName || 'Test',
        lastName: currentUser?.lastName || 'Agent',
        email: currentUser?.email || 'agent1@kredia.com',
        phoneNumber: '+21691000000',
        role: UserRole.AGENT,
        dateOfBirth: '1990-05-15',
        address: '123 Avenue Habib Bourguiba, Tunis, Tunisia',
        createdAt: '2024-01-15T08:00:00Z',
        lastLogin: new Date().toISOString()
      };
      
      setProfile(mockProfile);
      setFormData({
        firstName: mockProfile.firstName,
        lastName: mockProfile.lastName,
        email: mockProfile.email,
        phoneNumber: mockProfile.phoneNumber,
        address: mockProfile.address
      });
    } catch (error) {
      addToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(phone) && phone.length >= 8;
  };

  const validatePassword = (password: string) => {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /\d/.test(password);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validation
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
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Simuler la mise à jour du profil
      const updatedProfile = {
        ...profile!,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address
      };

      setProfile(updatedProfile);
      setEditing(false);
      setErrors({});
      
      addToast('Profile updated successfully', 'success');
    } catch (error) {
      addToast('Failed to update profile', 'error');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validation
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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Simuler le changement de mot de passe
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordEditing(false);
      setErrors({});
      
      addToast('Password changed successfully', 'success');
    } catch (error) {
      addToast('Failed to change password', 'error');
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      phoneNumber: profile?.phoneNumber || '',
      address: profile?.address || ''
    });
    setErrors({});
  };

  const cancelPasswordEdit = () => {
    setPasswordEditing(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Profile not found</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load your profile information</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and account settings</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
          >
            <Edit2 size={16} className="mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Overview */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <div className="p-6">
          <div className="flex items-center space-x-6">
            <div className="h-20 w-20 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-indigo-600">
                {profile.firstName[0]}{profile.lastName[0]}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-600">{profile.email}</p>
              <div className="flex items-center mt-2 space-x-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Briefcase size={12} className="mr-1" />
                  {profile.role}
                </span>
                <span className="text-sm text-gray-500">
                  Member since {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            {editing && (
              <div className="flex space-x-2">
                <button
                  onClick={cancelEdit}
                  className="flex items-center px-3 py-1 text-gray-600 hover:text-gray-900"
                >
                  <X size={16} className="mr-1" />
                  Cancel
                </button>
                <button
                  onClick={handleProfileUpdate}
                  className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  <Save size={16} className="mr-1" />
                  Save
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-1" />
                  First Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <p className="text-gray-900">{profile.firstName}</p>
                )}
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <p className="text-gray-900">{profile.lastName}</p>
                )}
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-1" />
                  Email Address
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <p className="text-gray-900">{profile.email}</p>
                )}
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-1" />
                  Phone Number
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <p className="text-gray-900">{profile.phoneNumber}</p>
                )}
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  Address
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profile.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Date of Birth
                </label>
                <p className="text-gray-900">{new Date(profile.dateOfBirth).toLocaleDateString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ShieldCheck size={16} className="inline mr-1" />
                  Role
                </label>
                <p className="text-gray-900">{profile.role}</p>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
            {!passwordEditing && (
              <button
                onClick={() => setPasswordEditing(true)}
                className="flex items-center px-3 py-1 text-indigo-600 hover:text-indigo-900"
              >
                <Lock size={16} className="mr-1" />
                Change Password
              </button>
            )}
          </div>

          {passwordEditing ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={cancelPasswordEdit}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Change Password
                </button>
              </div>
            </form>
          ) : (
            <p className="text-gray-500">Click "Change Password" to update your password</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentProfile;

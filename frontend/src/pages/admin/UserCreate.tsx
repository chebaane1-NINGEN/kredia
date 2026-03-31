import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRequestDTO, UserRole, UserStatus } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useToast } from '../../contexts/ToastContext';

const UserCreate: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserRequestDTO>({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: UserRole.CLIENT,
    status: UserStatus.PENDING,
    isActive: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.firstName || formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    if (!formData.lastName || formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    if (formData.phoneNumber && !/^\+?[0-9\s-]{8,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addToast('Please fix the form errors', 'error');
      return;
    }

    try {
      setLoading(true);
      await userApi.create(formData);
      addToast(`✅ User ${formData.firstName} ${formData.lastName} created successfully`, 'success');
      navigate('/admin/users');
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Failed to create user';
      addToast(`❌ ${message}`, 'error');
      
      // Handle specific backend errors
      if (message.includes('email')) {
        setErrors(prev => ({ ...prev, email: 'Email already exists' }));
      }
      if (message.includes('phone')) {
        setErrors(prev => ({ ...prev, phoneNumber: 'Phone number already exists' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof UserRequestDTO, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="user-create wow fadeInUp">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Create New User</h2>
          <p className="text-muted">Add a new user to the platform</p>
        </div>
        <button 
          onClick={() => navigate('/admin/users')} 
          className="btn btn-outline"
        >
          ← Back to Users
        </button>
      </div>

      <div className="card max-w-3xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Email */}
          <div className="form-group">
            <label className="form-label">
              Email Address <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'border-danger' : ''}`}
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="user@example.com"
              disabled={loading}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          {/* Name Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">
                First Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.firstName ? 'border-danger' : ''}`}
                value={formData.firstName}
                onChange={e => handleChange('firstName', e.target.value)}
                placeholder="John"
                disabled={loading}
              />
              {errors.firstName && <span className="form-error">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Last Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.lastName ? 'border-danger' : ''}`}
                value={formData.lastName}
                onChange={e => handleChange('lastName', e.target.value)}
                placeholder="Doe"
                disabled={loading}
              />
              {errors.lastName && <span className="form-error">{errors.lastName}</span>}
            </div>
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className={`form-control ${errors.phoneNumber ? 'border-danger' : ''}`}
              value={formData.phoneNumber}
              onChange={e => handleChange('phoneNumber', e.target.value)}
              placeholder="+1 234 567 890"
              disabled={loading}
            />
            {errors.phoneNumber && <span className="form-error">{errors.phoneNumber}</span>}
          </div>

          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">Role</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.values(UserRole).map(role => (
                <button
                  key={role}
                  type="button"
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    formData.role === role 
                      ? 'border-primary bg-primary-light text-primary' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleChange('role', role)}
                  disabled={loading}
                >
                  <div className="text-2xl mb-2">
                    {role === UserRole.ADMIN && '👑'}
                    {role === UserRole.EMPLOYEE && '👔'}
                    {role === UserRole.CLIENT && '👤'}
                  </div>
                  <div className="font-semibold text-sm">{role}</div>
                </button>
              ))}
            </div>
            <p className="text-muted text-sm mt-2">
              {formData.role === UserRole.ADMIN && 'Full system access and user management capabilities'}
              {formData.role === UserRole.EMPLOYEE && 'Can manage assigned clients and process loans'}
              {formData.role === UserRole.CLIENT && 'Standard user with loan and investment access'}
            </p>
          </div>

          {/* Initial Status */}
          <div className="form-group">
            <label className="form-label">Initial Status</label>
            <select
              className="form-control"
              value={formData.status}
              onChange={e => handleChange('status', e.target.value as UserStatus)}
              disabled={loading}
            >
              <option value={UserStatus.PENDING}>PENDING - Awaiting verification</option>
              <option value={UserStatus.ACTIVE}>ACTIVE - Immediate access</option>
              <option value={UserStatus.INACTIVE}>INACTIVE - Manual activation required</option>
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm mr-2"></span>
                  Creating User...
                </>
              ) : (
                'Create User'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserCreate;

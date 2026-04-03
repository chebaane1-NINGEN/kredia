import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRequestDTO, UserRole, UserStatus } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useToast } from '../../contexts/ToastContext';
import { 
  ChevronLeft, 
  UserPlus, 
  Mail, 
  User as UserIcon, 
  Phone, 
  Lock, 
  Shield, 
  ShieldCheck,
  UserCheck, 
  Loader2, 
  Save, 
  X,
  AlertCircle
} from 'lucide-react';

const UserCreate: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserRequestDTO>({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    role: UserRole.CLIENT,
    status: UserStatus.PENDING_VERIFICATION,
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
      addToast(`User ${formData.firstName} ${formData.lastName} created successfully`, 'success');
      navigate('/admin/users');
    } catch (err: any) {
      const message = err.message || 'Failed to create user';
      addToast(message, 'error');
      
      if (message.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: message }));
      }
      if (message.toLowerCase().includes('phone')) {
        setErrors(prev => ({ ...prev, phoneNumber: message }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof UserRequestDTO, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/users')}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Provision User</h1>
            <p className="text-slate-500 mt-1">Onboard a new professional to the Finova ecosystem.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="finova-card p-8 bg-slate-900 text-white border-none shadow-indigo-900/10">
            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
              <UserPlus size={28} />
            </div>
            <h3 className="text-xl font-bold mb-4">Onboarding Guide</h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                <p>Assign a unique email and valid phone number for identity verification.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                <p>Select the appropriate access level (Admin, Agent, or Client).</p>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                <p>The user will be created with "Pending Verification" status by default.</p>
              </li>
            </ul>
          </div>

          <div className="finova-card p-6 bg-indigo-50/50 border-indigo-100">
            <div className="flex items-center gap-3 text-indigo-600 mb-3">
              <AlertCircle size={20} />
              <h4 className="font-bold text-sm uppercase tracking-widest">Security Note</h4>
            </div>
            <p className="text-xs text-indigo-600/70 leading-relaxed">
              If no password is provided, the system will generate a temporary one. Users are required to change their password upon first login.
            </p>
          </div>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-8">
          <div className="finova-card p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><UserIcon size={18} /></div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Identity Information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                    <input 
                      type="text"
                      className={`w-full px-4 py-3 bg-slate-50 border ${errors.firstName ? 'border-rose-500' : 'border-slate-200'} rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all`}
                      value={formData.firstName} 
                      onChange={e => handleChange('firstName', e.target.value)} 
                      placeholder="John"
                      required
                    />
                    {errors.firstName && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                    <input 
                      type="text"
                      className={`w-full px-4 py-3 bg-slate-50 border ${errors.lastName ? 'border-rose-500' : 'border-slate-200'} rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all`}
                      value={formData.lastName} 
                      onChange={e => handleChange('lastName', e.target.value)} 
                      placeholder="Doe"
                      required
                    />
                    {errors.lastName && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                      <input 
                        type="email"
                        className={`w-full pl-12 pr-4 py-3 bg-slate-50 border ${errors.email ? 'border-rose-500' : 'border-slate-200'} rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all`}
                        value={formData.email} 
                        onChange={e => handleChange('email', e.target.value)} 
                        placeholder="john@finova.com"
                        required
                      />
                    </div>
                    {errors.email && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                      <input 
                        type="tel"
                        className={`w-full pl-12 pr-4 py-3 bg-slate-50 border ${errors.phoneNumber ? 'border-rose-500' : 'border-slate-200'} rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all`}
                        value={formData.phoneNumber} 
                        onChange={e => handleChange('phoneNumber', e.target.value)} 
                        placeholder="+216 -- --- ---"
                        required
                      />
                    </div>
                    {errors.phoneNumber && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.phoneNumber}</p>}
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Shield size={18} /></div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Access Control</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.values(UserRole).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleChange('role', role)}
                      className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all group ${
                        formData.role === role 
                          ? 'border-indigo-600 bg-indigo-50/50' 
                          : 'border-slate-100 hover:border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className={`p-3 rounded-xl transition-all ${
                        formData.role === role ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-400 group-hover:text-slate-600'
                      }`}>
                        {role === UserRole.ADMIN && <ShieldCheck size={24} />}
                        {role === UserRole.AGENT && <UserCheck size={24} />}
                        {role === UserRole.CLIENT && <UserIcon size={24} />}
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-bold ${formData.role === role ? 'text-indigo-600' : 'text-slate-700'}`}>{role}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {role === UserRole.ADMIN ? 'Full Access' : role === UserRole.AGENT ? 'Limited Mgmt' : 'End User'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Lock size={18} /></div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Security Configuration</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Initial Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input 
                      type="password"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all"
                      value={formData.password} 
                      onChange={e => handleChange('password', e.target.value)} 
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium ml-1 italic">Leave blank to use system default</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => navigate('/admin/users')}
                  className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <X size={18} /> Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> Create User</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCreate;
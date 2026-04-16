import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user.types';
import { 
  Mail, 
  Lock, 
  User, 
  Phone,
  Eye, 
  EyeOff, 
  ArrowRight, 
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  CreditCard
} from 'lucide-react';
import { 
  validateEmail, 
  validatePassword, 
  validatePasswordConfirm, 
  validateFullName, 
  validatePhoneNumber,
  getAuthErrorMessage, 
  getPasswordStrength,
  FormErrors 
} from '../utils/validation';

const Register: React.FC = () => {
  const { register, authError, clearAuthError, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: UserRole.CLIENT
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
    phoneNumber: false
  });

  useEffect(() => {
    if (currentUser) {
      const path = currentUser.role === UserRole.ADMIN ? '/admin' : currentUser.role === UserRole.AGENT ? '/agent' : '/client';
      navigate(path);
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (authError) {
      setErrors({ general: getAuthErrorMessage(authError, 'register') });
    }
  }, [authError]);

  // Real-time validation
  const validateField = (field: keyof typeof touched, value: string) => {
    let error = '';
    
    switch (field) {
      case 'firstName':
      case 'lastName':
        const nameValidation = validateFullName(value);
        error = nameValidation.error || '';
        break;
      case 'email':
        const emailValidation = validateEmail(value);
        error = emailValidation.error || '';
        break;
      case 'password':
        const passwordValidation = validatePassword(value);
        error = passwordValidation.error || '';
        break;
      case 'confirmPassword':
        const confirmValidation = validatePasswordConfirm(formData.password, value);
        error = confirmValidation.error || '';
        break;
      case 'phoneNumber':
        const phoneValidation = validatePhoneNumber(value);
        error = phoneValidation.error || '';
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleInputChange = (field: keyof typeof touched) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear general error when user starts typing
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }

    // Validate in real-time if field has been touched
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field: keyof typeof touched) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const isFormValid = () => {
    const firstNameValid = validateFullName(formData.firstName).isValid;
    const lastNameValid = validateFullName(formData.lastName).isValid;
    const emailValid = validateEmail(formData.email).isValid;
    const passwordValid = validatePassword(formData.password).isValid;
    const confirmValid = validatePasswordConfirm(formData.password, formData.confirmPassword).isValid;
    const phoneValid = validatePhoneNumber(formData.phoneNumber).isValid;
    
    return firstNameValid && lastNameValid && emailValid && passwordValid && confirmValid && phoneValid && !isLoading;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    
    // Mark all fields as touched
    setTouched({ 
      firstName: true, 
      lastName: true, 
      email: true, 
      password: true, 
      confirmPassword: true,
      phoneNumber: true
    });
    
    // Validate all fields
    const firstNameValid = validateField('firstName', formData.firstName);
    const lastNameValid = validateField('lastName', formData.lastName);
    const emailValid = validateField('email', formData.email);
    const passwordValid = validateField('password', formData.password);
    const confirmValid = validateField('confirmPassword', formData.confirmPassword);
    const phoneValid = validateField('phoneNumber', formData.phoneNumber);
    
    if (!firstNameValid || !lastNameValid || !emailValid || !passwordValid || !confirmValid || !phoneValid) {
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});
      
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber
      };
      
      await register(registrationData);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setErrors({ general: getAuthErrorMessage(err, 'register') });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md p-12 rounded-[32px] shadow-2xl text-center border border-slate-100 animate-fade-in">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-8 shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Account Created!</h2>
          <p className="text-slate-500 font-medium mb-8">Welcome to the Kredia ecosystem. We're redirecting you to the login page...</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full animate-progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row overflow-hidden">
      {/* Left Side - Visual/Marketing */}
      <div className="hidden md:flex md:w-[45%] bg-slate-900 p-16 flex-col justify-between relative overflow-hidden">
        {/* Animated Gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[50%] h-[30%] bg-emerald-500/10 blur-[100px] rounded-full"></div>
        
        <Link to="/" className="flex items-center gap-3 text-white relative z-10 group w-fit">
          <div className="w-10 h-10 glass rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-all">
            <ChevronLeft size={20} />
          </div>
          <span className="font-bold text-sm tracking-tight">Back to Kredia</span>
        </Link>

        <div className="relative z-10 max-w-lg">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-900/20 mb-10">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-5xl font-bold text-white mb-8 leading-[1.1] tracking-tight">
            Start your <br />
            <span className="text-indigo-500">financial legacy</span> <br />
            with Kredia.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-12">
            Join thousands of professionals managing their wealth with institutional-grade security and predictive analytics.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <UserCheck className="text-indigo-400 mb-3" size={24} />
              <h4 className="text-white font-bold text-sm mb-1">Personalized</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Dashboards tailored to your specific role and goals.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <CreditCard className="text-emerald-400 mb-3" size={24} />
              <h4 className="text-white font-bold text-sm mb-1">Instant Credit</h4>
              <p className="text-slate-500 text-xs leading-relaxed">AI-driven risk scoring for immediate loan eligibility.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="text-slate-500 text-xs font-bold tracking-widest uppercase">
            Kredia © 2026
          </div>
          <div className="flex gap-4">
            <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
            <div className="w-2 h-2 rounded-full bg-slate-800"></div>
            <div className="w-2 h-2 rounded-full bg-slate-800"></div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-20 bg-white overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-md py-8">
          {/* Mobile Header */}
          <div className="text-center md:text-left mb-10">
            <div className="md:hidden flex items-center justify-center gap-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold italic">K</div>
              <span className="text-2xl font-bold tracking-tight text-slate-900 uppercase">KREDIA</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Create Account</h2>
            <p className="text-slate-500 font-medium">Start your intelligent financial journey with Kredia.</p>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 mb-8 animate-shake">
              <AlertCircle className="text-rose-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-rose-600 text-sm font-bold">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest mb-2">
                  First Name
                </label>
                <div className="relative group">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    touched.firstName && errors.firstName ? 'text-rose-500' : 
                    touched.firstName && !errors.firstName ? 'text-emerald-500' : 
                    'text-slate-400 group-focus-within:text-indigo-600'
                  }`}>
                    {touched.firstName && !errors.firstName ? <CheckCircle2 size={18} /> : <User size={18} />}
                  </div>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange('firstName')}
                    onBlur={handleBlur('firstName')}
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl border font-medium transition-all outline-none text-slate-900 ${
                      touched.firstName && errors.firstName 
                        ? 'border-rose-300 bg-rose-50 focus:border-rose-500' 
                        : touched.firstName && !errors.firstName
                        ? 'border-emerald-300 bg-emerald-50 focus:border-emerald-500'
                        : 'border-slate-200 bg-slate-50 focus:border-indigo-600 focus:bg-white'
                    }`}
                    placeholder="John"
                    autoComplete="given-name"
                  />
                </div>
                {touched.firstName && errors.firstName && (
                  <div className="flex items-center gap-2 mt-2 text-rose-500 text-sm animate-fade-in">
                    <AlertCircle size={14} />
                    {errors.firstName}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest mb-2">
                  Last Name
                </label>
                <div className="relative group">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    touched.lastName && errors.lastName ? 'text-rose-500' : 
                    touched.lastName && !errors.lastName ? 'text-emerald-500' : 
                    'text-slate-400 group-focus-within:text-indigo-600'
                  }`}>
                    {touched.lastName && !errors.lastName ? <CheckCircle2 size={18} /> : <User size={18} />}
                  </div>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange('lastName')}
                    onBlur={handleBlur('lastName')}
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl border font-medium transition-all outline-none text-slate-900 ${
                      touched.lastName && errors.lastName 
                        ? 'border-rose-300 bg-rose-50 focus:border-rose-500' 
                        : touched.lastName && !errors.lastName
                        ? 'border-emerald-300 bg-emerald-50 focus:border-emerald-500'
                        : 'border-slate-200 bg-slate-50 focus:border-indigo-600 focus:bg-white'
                    }`}
                    placeholder="Doe"
                    autoComplete="family-name"
                  />
                </div>
                {touched.lastName && errors.lastName && (
                  <div className="flex items-center gap-2 mt-2 text-rose-500 text-sm animate-fade-in">
                    <AlertCircle size={14} />
                    {errors.lastName}
                  </div>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                  touched.email && errors.email ? 'text-rose-500' : 
                  touched.email && !errors.email ? 'text-emerald-500' : 
                  'text-slate-400 group-focus-within:text-indigo-600'
                }`}>
                  {touched.email && !errors.email ? <CheckCircle2 size={18} /> : <Mail size={18} />}
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  onBlur={handleBlur('email')}
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl border font-medium transition-all outline-none text-slate-900 ${
                    touched.email && errors.email 
                      ? 'border-rose-300 bg-rose-50 focus:border-rose-500' 
                      : touched.email && !errors.email
                      ? 'border-emerald-300 bg-emerald-50 focus:border-emerald-500'
                      : 'border-slate-200 bg-slate-50 focus:border-indigo-600 focus:bg-white'
                  }`}
                  placeholder="john@example.com"
                  autoComplete="email"
                />
              </div>
              {touched.email && errors.email && (
                <div className="flex items-center gap-2 mt-2 text-rose-500 text-sm animate-fade-in">
                  <AlertCircle size={14} />
                  {errors.email}
                </div>
              )}
            </div>

            {/* Phone Number Field */}
            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest mb-2">
                Phone Number
              </label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                  touched.phoneNumber && errors.phoneNumber ? 'text-rose-500' : 
                  touched.phoneNumber && !errors.phoneNumber ? 'text-emerald-500' : 
                  'text-slate-400 group-focus-within:text-indigo-600'
                }`}>
                  {touched.phoneNumber && !errors.phoneNumber ? <CheckCircle2 size={18} /> : <Phone size={18} />}
                </div>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange('phoneNumber')}
                  onBlur={handleBlur('phoneNumber')}
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl border font-medium transition-all outline-none text-slate-900 ${
                    touched.phoneNumber && errors.phoneNumber 
                      ? 'border-rose-300 bg-rose-50 focus:border-rose-500' 
                      : touched.phoneNumber && !errors.phoneNumber
                      ? 'border-emerald-300 bg-emerald-50 focus:border-emerald-500'
                      : 'border-slate-200 bg-slate-50 focus:border-indigo-600 focus:bg-white'
                  }`}
                  placeholder="+216 2000 0000"
                  autoComplete="tel"
                />
              </div>
              {touched.phoneNumber && errors.phoneNumber && (
                <div className="flex items-center gap-2 mt-2 text-rose-500 text-sm animate-fade-in">
                  <AlertCircle size={14} />
                  {errors.phoneNumber}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                  touched.password && errors.password ? 'text-rose-500' : 
                  touched.password && !errors.password ? 'text-emerald-500' : 
                  'text-slate-400 group-focus-within:text-indigo-600'
                }`}>
                  {touched.password && !errors.password ? <CheckCircle2 size={18} /> : <Lock size={18} />}
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  onBlur={handleBlur('password')}
                  className={`w-full pl-12 pr-12 py-3.5 rounded-xl border font-medium transition-all outline-none text-slate-900 ${
                    touched.password && errors.password 
                      ? 'border-rose-300 bg-rose-50 focus:border-rose-500' 
                      : touched.password && !errors.password
                      ? 'border-emerald-300 bg-emerald-50 focus:border-emerald-500'
                      : 'border-slate-200 bg-slate-50 focus:border-indigo-600 focus:bg-white'
                  }`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <div className="flex items-center gap-2 mt-2 text-rose-500 text-sm animate-fade-in">
                  <AlertCircle size={14} />
                  {errors.password}
                </div>
              )}
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-slate-600">Password Strength</span>
                    <span className={`text-xs font-bold text-${passwordStrength.color}-600`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-${passwordStrength.color}-500 transition-all duration-300`}
                      style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest mb-2">
                Confirm Password
              </label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                  touched.confirmPassword && errors.confirmPassword ? 'text-rose-500' : 
                  touched.confirmPassword && !errors.confirmPassword ? 'text-emerald-500' : 
                  'text-slate-400 group-focus-within:text-indigo-600'
                }`}>
                  {touched.confirmPassword && !errors.confirmPassword ? <CheckCircle2 size={18} /> : <Lock size={18} />}
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  className={`w-full pl-12 pr-12 py-3.5 rounded-xl border font-medium transition-all outline-none text-slate-900 ${
                    touched.confirmPassword && errors.confirmPassword 
                      ? 'border-rose-300 bg-rose-50 focus:border-rose-500' 
                      : touched.confirmPassword && !errors.confirmPassword
                      ? 'border-emerald-300 bg-emerald-50 focus:border-emerald-500'
                      : 'border-slate-200 bg-slate-50 focus:border-indigo-600 focus:bg-white'
                  }`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <div className="flex items-center gap-2 mt-2 text-rose-500 text-sm animate-fade-in">
                  <AlertCircle size={14} />
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid()}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Kredia Account
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-slate-600 font-medium">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user.types';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ChevronLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Globe,
  TrendingUp,
  Wallet,
  CheckCircle2
} from 'lucide-react';
import { validateEmail, validatePassword, getAuthErrorMessage, FormErrors } from '../utils/validation';

const Login: React.FC = () => {
  const { loginWithEmail, authError, clearAuthError, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });

  useEffect(() => {
    if (currentUser) {
      const path = currentUser.role === UserRole.ADMIN ? '/admin' : currentUser.role === UserRole.AGENT ? '/agent' : '/client';
      navigate(path);
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (authError) {
      setErrors({ general: getAuthErrorMessage(authError, 'login') });
    }
  }, [authError]);

  // Real-time validation
  const validateField = (field: 'email' | 'password', value: string) => {
    let error = '';
    
    if (field === 'email') {
      const emailValidation = validateEmail(value);
      error = emailValidation.error || '';
    } else if (field === 'password') {
      const passwordValidation = validatePassword(value);
      error = passwordValidation.error || '';
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleInputChange = (field: 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleBlur = (field: 'email' | 'password') => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const isFormValid = () => {
    const emailValid = validateEmail(formData.email).isValid;
    const passwordValid = validatePassword(formData.password).isValid;
    return emailValid && passwordValid && !isLoading;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    
    // Mark all fields as touched
    setTouched({ email: true, password: true });
    
    // Validate all fields
    const emailValid = validateField('email', formData.email);
    const passwordValid = validateField('password', formData.password);
    
    if (!emailValid || !passwordValid) {
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});
      await loginWithEmail(formData.email, formData.password);
    } catch (err: any) {
      setErrors({ general: getAuthErrorMessage(err, 'login') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* Left Side - Visual/Marketing */}
      <div className="hidden lg:flex lg:w-[45%] bg-slate-900 p-12 xl:p-16 flex-col justify-between relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[50%] h-[30%] bg-green-500/10 blur-[100px] rounded-full"></div>
        
        <Link to="/" className="flex items-center gap-3 text-white relative z-10 group w-fit">
          <div className="w-10 h-10 glass rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-all">
            <ChevronLeft size={20} />
          </div>
          <span className="font-bold text-sm tracking-tight">Back to Kredia</span>
        </Link>

        <div className="relative z-10 max-w-lg">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/20 mb-8">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
            Welcome back to <br />
            <span className="text-gradient">Kredia</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            Access your intelligent financial dashboard with real-time risk scoring and personalized insights.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-2xl glass group hover:bg-white/10 transition-all cursor-default">
              <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                <Zap size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Smart Risk Analysis</h4>
                <p className="text-slate-500 text-xs mt-1">AI-powered financial insights updated in real-time.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-2xl glass group hover:bg-white/10 transition-all cursor-default">
              <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                <Globe size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Secure Access</h4>
                <p className="text-slate-500 text-xs mt-1">Bank-level security protects your financial data.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="text-slate-500 text-xs font-bold tracking-widest uppercase">
            Kredia © 2026
          </div>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-20 bg-white overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-md py-8">
          {/* Mobile Header */}
          <div className="text-center md:text-left mb-10">
            <div className="md:hidden flex items-center justify-center gap-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold italic">K</div>
              <span className="text-2xl font-bold tracking-tight text-slate-900 uppercase">KREDIA</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Welcome Back</h2>
            <p className="text-slate-500 font-medium">Sign in to your Kredia account</p>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 mb-8 animate-shake">
              <AlertCircle className="text-rose-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-rose-600 text-sm font-bold">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
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
                  autoComplete="current-password"
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
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link 
                to="/forgot-password" 
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                Forgot your password?
              </Link>
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
                  Signing In...
                </>
              ) : (
                <>
                  Sign In to Kredia
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-slate-600 font-medium">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

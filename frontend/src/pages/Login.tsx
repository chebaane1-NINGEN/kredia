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
import { validateEmail, validateLoginPassword, getAuthErrorMessage, FormErrors } from '../utils/validation';

const Login: React.FC = () => {
  const { login, loginWithGoogle, loginWithGithub, authError, clearAuthError, currentUser } = useAuth();
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
      const passwordValidation = validateLoginPassword(value);
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
    const passwordValid = validateLoginPassword(formData.password).isValid;
    return emailValid && passwordValid && !isLoading;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    
    // Debug: Log form data
    console.log("=== LOGIN DEBUG ===");
    console.log("Form Data:", { email: formData.email, password: formData.password });
    
    // Mark all fields as touched
    setTouched({ email: true, password: true });
    
    // Validate all fields
    const emailValid = validateField('email', formData.email);
    const passwordValid = validateField('password', formData.password);
    
    if (!emailValid || !passwordValid) {
      console.log("Validation failed:", { emailValid, passwordValid });
      return;
    }

    try {
      setIsLoading(true);
      await login(formData.email, formData.password);
      // Navigation is handled by useEffect on currentUser change
    } catch (err: any) {
      // Error is handled by useEffect on authError change
      console.error("Login Error:", err);
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

          {/* Social Logins */}
          <div className="mt-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm uppercase tracking-widest">
                <span className="px-4 bg-white text-slate-500 font-bold">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={loginWithGoogle}
                className="flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-slate-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') ?? 'http://localhost:8086'}/oauth2/authorization/github`}
                className="flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-slate-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                GitHub
              </button>
            </div>
          </div>

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

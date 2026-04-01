import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Apple } from 'lucide-react';

const Login: React.FC = () => {
  const { loginWithEmail, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Display auth context errors
  React.useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await loginWithEmail(email, password);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans overflow-hidden">
      {/* Left Side: Illustration & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1E56FF] p-12 flex-col justify-between relative overflow-hidden">
        {/* Modern abstract shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[150px] opacity-30"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-8 opacity-20">
          <div className="grid grid-cols-3 gap-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 bg-white rounded-full"></div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
              <div className="w-4 h-4 bg-[#1E56FF] rounded-sm transform rotate-45"></div>
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">Overpay.</span>
          </div>

          <div className="relative z-10">
            {/* Mock Dashboard Card */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm mb-12 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Balance</p>
                  <p className="text-3xl font-bold text-gray-900">$42,500.00</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                            <span className="text-blue-500 text-xs font-bold">S</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">Stripe Deposit</span>
                    </div>
                    <span className="text-sm font-bold text-green-500">+$523.10</span>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                            <span className="text-blue-500 text-xs font-bold">F</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">Facebook Ad</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">-$600.00</span>
                </div>
              </div>

              <div className="p-3 bg-blue-500 rounded-2xl text-center">
                <p className="text-xs font-bold text-white">View Details</p>
              </div>
            </div>

            <div className="absolute -left-8 top-1/2 bg-white rounded-2xl p-4 shadow-xl transform -rotate-6 scale-90">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                        <span className="text-green-500 font-bold">✓</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400">Security Check</p>
                        <p className="text-sm font-bold">Verified</p>
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-white text-5xl font-bold mb-6 leading-tight">
            Sign in to your account
          </h1>
          <p className="text-blue-100 text-lg max-w-md mb-8">
            Access your financial dashboard and manage your assets with ease. Secure, fast and reliable financial services at your fingertips.
          </p>
          <div className="flex gap-2">
            <div className="w-8 h-1 bg-white rounded-full"></div>
            <div className="w-2 h-1 bg-white/30 rounded-full"></div>
            <div className="w-2 h-1 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F4F7FE]">
        <div className="w-full max-w-md bg-white/70 backdrop-blur-xl p-10 rounded-[40px] shadow-2xl border border-white/50">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-[#2B3674] mb-3 tracking-tight">Welcome Back</h2>
            <p className="text-[#A3AED0] font-medium">Enter your credentials to access your account</p>
          </div>

          <div className="flex gap-4 mb-8">
            <button className="flex-1 flex items-center justify-center gap-2 border border-[#E0E5F2] rounded-2xl py-3 px-4 bg-white hover:bg-gray-50 transition-colors shadow-sm">
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              <span className="text-sm font-bold text-[#2B3674]">Google</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 border border-[#E0E5F2] rounded-2xl py-3 px-4 bg-white hover:bg-gray-50 transition-colors shadow-sm">
              <Apple size={20} className="text-black fill-black" />
              <span className="text-sm font-bold text-[#2B3674]">Apple</span>
            </button>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-[#E0E5F2]"></div>
            <span className="text-[#A3AED0] text-sm font-bold uppercase tracking-wider">Or with email</span>
            <div className="flex-1 h-px bg-[#E0E5F2]"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-5 text-[#2B3674] font-bold focus:ring-2 focus:ring-[#4318FF] transition-all placeholder:text-[#A3AED0] placeholder:font-medium"
                required
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-5 text-[#2B3674] font-bold focus:ring-2 focus:ring-[#4318FF] transition-all placeholder:text-[#A3AED0] placeholder:font-medium"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#A3AED0] hover:text-[#2B3674]"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="remember" className="w-4 h-4 rounded border-[#E0E5F2] text-[#4318FF] focus:ring-[#4318FF]" />
                    <label htmlFor="remember" className="text-sm text-[#A3AED0] font-bold">Remember me</label>
                </div>
                <button type="button" className="text-sm text-[#4318FF] font-bold hover:underline">Forgot Password?</button>
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#4318FF] text-white font-bold py-5 rounded-2xl shadow-lg shadow-blue-200 hover:bg-[#3714d6] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider for Quick Access */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-[#E0E5F2]"></div>
            <span className="text-[#A3AED0] text-sm font-bold uppercase tracking-wider">Quick Access</span>
            <div className="flex-1 h-px bg-[#E0E5F2]"></div>
          </div>

          {/* Quick Login Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <button
              type="button"
              className="bg-[#F4F7FE] hover:bg-[#E0E5F2] text-[#2B3674] font-bold py-3 rounded-2xl transition-all text-xs"
              onClick={() => { setEmail('admin@kredia.com'); setPassword('password'); }}
              disabled={isLoading}
            >
              Admin
            </button>
            <button
              type="button"
              className="bg-[#F4F7FE] hover:bg-[#E0E5F2] text-[#2B3674] font-bold py-3 rounded-2xl transition-all text-xs"
              onClick={() => { setEmail('agent1@kredia.com'); setPassword('password'); }}
              disabled={isLoading}
            >
              Agent
            </button>
            <button
              type="button"
              className="bg-[#F4F7FE] hover:bg-[#E0E5F2] text-[#2B3674] font-bold py-3 rounded-2xl transition-all text-xs"
              onClick={() => { setEmail('client1@kredia.com'); setPassword('password'); }}
              disabled={isLoading}
            >
              Client
            </button>
          </div>

          <div className="text-center">
            <p className="text-[#A3AED0] font-bold">
              Don't have an account? <Link to="/register" className="text-[#4318FF] hover:underline">Sign Up</Link>
            </p>
          </div>

          <div className="flex justify-between mt-16 text-[10px] text-[#A3AED0] font-bold uppercase tracking-widest">
            <span className="cursor-pointer hover:text-[#2B3674]">Privacy Policy</span>
            <span>Copyright 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal Lucide-like Eye/EyeOff icons
const Eye = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOff = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
);

export default Login;

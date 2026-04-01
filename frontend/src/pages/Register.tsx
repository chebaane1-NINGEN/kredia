import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, Loader2, Apple } from 'lucide-react';

const Register: React.FC = () => {
  const { loginWithEmail, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      // In a real app, we would call registerApi first. 
      // For this demo, let's assume we can just login after registration if successful.
      // But for now, we'll just show the UI as requested.
      
      // Simulate registration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to login after successful registration
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex min-h-screen bg-white font-sans overflow-hidden">
      {/* Left Side: Illustration & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1E56FF] p-12 flex-col justify-between relative overflow-hidden">
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
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-[#1E56FF] rounded-sm transform rotate-45"></div>
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">Overpay.</span>
          </div>

          <div className="relative z-10">
            {/* Mock Dashboard Card */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm mb-12 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-gray-400 text-xs font-medium">Income</p>
                  <p className="text-2xl font-bold text-gray-900">$24,908.00</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs font-medium">Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">$1,028.00</p>
                </div>
              </div>
              
              <div className="h-24 flex items-end gap-1 mb-4">
                {[40, 60, 45, 70, 55, 80, 65, 90].map((h, i) => (
                  <div key={i} className="flex-1 bg-blue-50 rounded-t-lg relative group">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-lg transition-all duration-1000" 
                      style={{ height: `${h}%` }}
                    ></div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center text-white text-[10px]">✓</div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Payment Received</p>
                    <p className="text-[10px] text-blue-500 font-bold">+$34,908.00</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -right-8 top-1/2 bg-white rounded-2xl p-4 shadow-xl transform rotate-6 scale-90">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                        <span className="text-green-500 font-bold">✓</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400">Transfer successful</p>
                        <p className="text-sm font-bold">$35,798.00</p>
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-white text-5xl font-bold mb-6 leading-tight">
            Speady, Easy and Fast
          </h1>
          <p className="text-blue-100 text-lg max-w-md mb-8">
            Overpay help you set saving goals, earn cash back offers, Go to disclaimer for more details and get paychecks up to two days early. Get a <span className="text-yellow-400 font-bold">$20</span> bonus when you receive qualifying direct deposits
          </p>
          <div className="flex gap-2">
            <div className="w-8 h-1 bg-white rounded-full"></div>
            <div className="w-2 h-1 bg-white/30 rounded-full"></div>
            <div className="w-2 h-1 bg-white/30 rounded-full"></div>
          </div>
        </div>
        
        {/* Decorative dots grid */}
        <div className="absolute bottom-12 left-12 opacity-20">
            <div className="grid grid-cols-4 gap-3">
                {[...Array(16)].map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-white rounded-full"></div>
                ))}
            </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F4F7FE]">
        <div className="w-full max-w-md bg-white/70 backdrop-blur-xl p-10 rounded-[40px] shadow-2xl border border-white/50">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-[#2B3674] mb-3 tracking-tight">Sign up for an account</h2>
            <p className="text-[#A3AED0] font-medium">Send, spend and save smarter</p>
          </div>

          <div className="flex gap-4 mb-8">
            <button className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 px-4 hover:bg-gray-50 transition-colors">
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              <span className="text-sm font-semibold text-gray-700">Sign Up with Google</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 px-4 hover:bg-gray-50 transition-colors">
              <Apple size={20} className="text-black fill-black" />
              <span className="text-sm font-semibold text-gray-700">Sign Up with Apple</span>
            </button>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="text-gray-400 text-sm font-medium">Or with email</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              By creating an account, you agreeing to our <span className="text-gray-900 font-semibold cursor-pointer">Privacy Policy</span>, and <span className="text-gray-900 font-semibold cursor-pointer">Electronics Communication Policy</span>.
            </p>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1E56FF] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <div className="text-center mt-8">
            <p className="text-gray-500 font-medium">
              Already have an account? <Link to="/login" className="text-gray-900 font-bold hover:underline">Sign In</Link>
            </p>
          </div>

          <div className="flex justify-between mt-24 text-[10px] text-gray-400 font-medium uppercase tracking-widest">
            <span className="cursor-pointer hover:text-gray-600">Privacy Policy</span>
            <span>Copyright 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal Lucide-like Eye/EyeOff icons if not imported correctly
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

export default Register;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  ArrowRight, 
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSuccess(true);
    } catch (err: any) {
      setError('Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full"></div>

      <div className="bg-white w-full max-w-md p-10 md:p-12 rounded-[32px] shadow-2xl relative overflow-hidden border border-slate-100 animate-fade-in">
        <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-10 transition-colors group">
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Sign In
        </Link>

        <div className="mb-10 text-center md:text-left">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 mx-auto md:mx-0 shadow-inner">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Recover Password</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Institutional recovery process. Enter your work email to receive reset instructions.
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center py-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-inner">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Check your inbox</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              We've sent a secure recovery link to <span className="text-slate-900 font-bold">{email}</span>. Please follow the instructions provided.
            </p>
            <Link 
              to="/login" 
              className="w-full inline-block bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 animate-shake">
                <AlertCircle className="text-rose-500 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-rose-600 text-sm font-bold">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-xl py-4 pl-12 pr-4 text-slate-900 font-semibold transition-all outline-none text-sm shadow-sm"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Send Recovery Link</span>
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-10 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
            Finova Recovery Service
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
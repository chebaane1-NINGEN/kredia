import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowUpRight, 
  BarChart3, 
  ShieldCheck, 
  Smartphone, 
  CreditCard, 
  Zap, 
  LayoutDashboard, 
  ChevronRight,
  CheckCircle2,
  Users,
  Activity,
  Lock,
  Search,
  ArrowRight as ArrowIcon,
  Globe,
  PieChart,
  TrendingUp,
  Fingerprint,
  Star,
  Award,
  Target
} from 'lucide-react';

const Home: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md text-white py-6 px-8 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-3 font-bold text-2xl tracking-tighter">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <span className="tracking-tight">KREDIA</span>
        </div>
        
        <div className="hidden md:flex gap-10 text-sm font-semibold text-slate-400">
          <a href="#features" className="hover:text-white transition-colors uppercase tracking-widest text-[10px]">Features</a>
          <a href="#why-kredia" className="hover:text-white transition-colors uppercase tracking-widest text-[10px]">Why Kredia</a>
          <a href="#trust" className="hover:text-white transition-colors uppercase tracking-widest text-[10px]">Trust</a>
          <Link to="/contact" className="hover:text-white transition-colors uppercase tracking-widest text-[10px]">Contact</Link>
        </div>

        <div className="flex gap-6 items-center">
          {currentUser ? (
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-white/5 backdrop-blur-md text-white px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <LayoutDashboard size={14} />
              Dashboard
            </button>
          ) : (
            <>
              <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Log In</Link>
              <Link to="/register" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95">
                Create Account
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="bg-slate-900 text-white pt-48 pb-40 px-6 text-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-purple-600/5 blur-[100px] rounded-full"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex justify-center items-center gap-4 mb-12 animate-fade-in">
             <button className="bg-white/5 border border-white/10 rounded-full px-6 py-2 flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] hover:bg-white/10 transition-all uppercase">
               <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
               Smart Financial Management <ArrowUpRight size={14} className="text-green-500" />
             </button>
          </div>
          
          <h1 className="text-6xl md:text-[100px] font-extrabold tracking-tight mb-10 leading-[0.95] text-white">
            Take Control of Your <br />
            <span className="text-gradient">Financial Future</span> <br />
            with Kredia
          </h1>
          
          <p className="text-slate-400 text-lg md:text-2xl max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
            Simple, secure, and intelligent financial management with real-time risk scoring, 
            eligibility prediction, and personalized insights powered by AI.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-32">
            <Link 
              to="/register" 
              className="btn-primary w-full sm:w-auto px-12 py-6 text-lg flex items-center justify-center gap-3"
            >
              Create Account
              <ArrowIcon className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/register" 
              className="glass w-full sm:w-auto px-12 py-6 text-lg font-bold flex items-center justify-center gap-3"
            >
              Start Now
            </Link>
          </div>
          
          {/* Floating Credit Card Image Mockup */}
          <div className="relative mt-24 max-w-4xl mx-auto perspective-1000">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-600/20 blur-[150px] rounded-full pointer-events-none"></div>
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Card Front */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-700 p-1 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(79,70,229,0.3)] transform rotate-y-[-10deg] hover:rotate-y-0 transition-transform duration-1000 group">
                <div className="bg-[#0A0C14] rounded-[2.9rem] p-12 text-left aspect-[1.6/1] flex flex-col justify-between overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full"></div>
                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-16 h-16 border-2 border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Zap className="text-indigo-400 fill-indigo-400" size={32} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe size={20} className="text-white/20" />
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Worldwide</span>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className="text-white/30 text-xs tracking-[0.4em] mb-4 uppercase font-black">Digital Wealth Equity</p>
                    <p className="text-4xl font-mono tracking-[0.2em] text-white mb-10">**** **** 8824</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white/20 text-[10px] uppercase font-black tracking-[0.2em] mb-2">Member Since</p>
                        <p className="text-sm font-bold text-white/80 tracking-widest uppercase">JAN 2026</p>
                      </div>
                      <div className="flex -space-x-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-500/80 backdrop-blur-md border border-white/10"></div>
                        <div className="w-12 h-12 rounded-full bg-purple-500/80 backdrop-blur-md border border-white/10"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Card Mockup */}
              <div className="hidden md:flex flex-col gap-6 transform translate-x-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] text-left hover:bg-white/10 transition-all duration-500 cursor-default group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-xl">+$12,480.00</p>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Monthly Forecast</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[70%] group-hover:w-[85%] transition-all duration-1000"></div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] text-left hover:bg-white/10 transition-all duration-500 cursor-default group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center">
                      <Fingerprint size={24} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-xl">Secured</p>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Biometric Auth</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= 5 ? 'bg-indigo-500' : 'bg-white/10'}`}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PARTNERS --- */}
      <section className="py-24 bg-white border-b border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mb-16">Trusted by the best in the industry</p>
          <div className="flex flex-wrap justify-center md:justify-between items-center opacity-30 grayscale gap-16 md:gap-8">
            <span className="font-bold text-3xl italic tracking-tighter text-slate-900">dribbble</span>
            <span className="font-bold text-3xl tracking-tighter text-slate-900">Behance</span>
            <span className="font-bold text-3xl uppercase tracking-tighter text-slate-900">Instagram</span>
            <span className="font-bold text-3xl tracking-tighter text-slate-900">Chargebee</span>
            <span className="font-bold text-3xl underline tracking-tighter text-slate-900">Stackoverflow</span>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-40 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-32">
          <span className="text-indigo-600 font-black text-xs tracking-[0.4em] uppercase mb-6 block">Smart Financial Features</span>
          <h2 className="text-5xl md:text-7xl font-extrabold mb-10 leading-[1.1] text-slate-900 tracking-tight">Intelligent Money <br/> Management Made Simple</h2>
          <p className="text-slate-500 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            Take control of your financial future with AI-powered insights, real-time risk scoring, 
            and personalized eligibility predictions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center mb-40">
          <div className="space-y-12">
            <div className="flex gap-8 group">
              <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                <Target size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Smart Risk Score</h3>
                <p className="text-slate-500 text-lg leading-relaxed">Get real-time risk assessment powered by AI algorithms that analyze your financial patterns and provide personalized insights.</p>
              </div>
            </div>
            
            <div className="flex gap-8 group">
              <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-sm">
                <Award size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Eligibility Prediction</h3>
                <p className="text-slate-500 text-lg leading-relaxed">Know your eligibility for financial products instantly with our predictive scoring system.</p>
              </div>
            </div>

            <div className="flex gap-8 group">
              <div className="w-20 h-20 bg-purple-50 rounded-[2rem] flex items-center justify-center text-purple-600 shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 shadow-sm">
                <Activity size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Activity Tracking</h3>
                <p className="text-slate-500 text-lg leading-relaxed">Monitor all your financial activities in one place with intelligent categorization and spending insights.</p>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-10 bg-indigo-100/50 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="relative bg-slate-50 p-10 rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden group">
              <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 h-[500px] flex flex-col justify-between overflow-hidden">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Risk Score</p>
                    <p className="text-4xl font-bold text-slate-900">847<span className="text-xl text-slate-400">/1000</span></p>
                  </div>
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                    <Star className="text-emerald-600" size={32} />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <span className="text-slate-600 font-medium">Credit Eligibility</span>
                    <span className="text-emerald-600 font-bold">92%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <span className="text-slate-600 font-medium">Loan Approval</span>
                    <span className="text-emerald-600 font-bold">High</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <span className="text-slate-600 font-medium">Risk Level</span>
                    <span className="text-emerald-600 font-bold">Low</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-slate-400 text-xs">Last updated: 2 hours ago</p>
                  <button className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 transition-colors">
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
                  {/* --- WHY KREDIA SECTION --- */}
      <section id="why-kredia" className="py-40 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-24">
            <span className="text-indigo-600 font-black text-xs tracking-[0.4em] uppercase mb-6 block">Why Choose Kredia</span>
            <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-10 tracking-tight">Intelligent Financial <br/>Management for Everyone</h2>
            <p className="text-slate-500 text-xl max-w-3xl mx-auto font-medium">Experience the future of personal finance with AI-powered insights and personalized recommendations.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                title: "Intelligent Insights", 
                icon: <BarChart3 size={28} />,
                desc: "AI-powered financial analytics that understand your unique patterns and provide actionable recommendations.",
                color: "from-indigo-500 to-indigo-600"
              },
              { 
                title: "Secure & Private", 
                icon: <ShieldCheck size={28} />,
                desc: "Bank-level encryption and biometric authentication keep your financial data completely secure.",
                color: "from-emerald-500 to-emerald-600"
              },
              { 
                title: "Real-time Tracking", 
                icon: <Activity size={28} />,
                desc: "Monitor all your financial activities in real-time with intelligent categorization and instant alerts.",
                color: "from-purple-500 to-purple-600"
              },
              { 
                title: "Smart Eligibility", 
                icon: <Target size={28} />,
                desc: "Know your eligibility for financial products instantly with our advanced scoring algorithms.",
                color: "from-amber-500 to-amber-600"
              }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TRUST SECTION --- */}
      <section id="trust" className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 border-2 border-white"></div>
                ))}
              </div>
              <span className="text-2xl">⭐</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-2">Trusted by thousands of users</p>
            <p className="text-slate-500">Join professionals managing their financial future with Kredia</p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-between items-center opacity-60 grayscale gap-12 md:gap-8">
            <span className="font-bold text-2xl italic tracking-tighter text-slate-900">Stripe</span>
            <span className="font-bold text-2xl tracking-tighter text-slate-900">Revolut</span>
            <span className="font-bold text-2xl uppercase tracking-tighter text-slate-900">Wise</span>
            <span className="font-bold text-2xl tracking-tighter text-slate-900">Plaid</span>
            <span className="font-bold text-2xl underline tracking-tighter text-slate-900">Monzo</span>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section id="contact" className="py-40 px-6">
        <div className="max-w-7xl mx-auto bg-slate-900 rounded-[4rem] p-16 md:p-32 text-center relative overflow-hidden shadow-2xl group">
          <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-indigo-600/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:bg-indigo-600/20 transition-all duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-purple-600/5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
          
          <div className="relative z-10">
            <span className="text-indigo-400 font-black text-xs tracking-[0.5em] uppercase mb-10 block">Ready to transform your finances?</span>
            <h2 className="text-5xl md:text-8xl font-extrabold text-white mb-12 leading-[0.95] tracking-tighter">Start your journey <br /> with Kredia today.</h2>
            <p className="text-slate-400 text-xl md:text-2xl max-w-2xl mx-auto mb-16 leading-relaxed font-medium">
              Join thousands of users who are already managing their financial future with intelligent insights and personalized recommendations.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                to="/register" 
                className="btn-primary px-16 py-6 text-xl flex items-center justify-center gap-3"
              >
                Get Started Now
                <ArrowIcon className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/login" 
                className="glass px-16 py-6 text-xl font-bold flex items-center justify-center gap-3"
              >
                Sign In to Kredia
              </Link>
            </div>
          </div>
        </div>
      </section>
              {/* --- FOOTER --- */}
      <footer className="bg-white pt-40 pb-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-24 mb-32">
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                <span className="text-3xl font-black tracking-tighter text-slate-900 uppercase">KREDIA</span>
              </div>
              <p className="text-slate-500 text-xl max-w-md mb-12 leading-relaxed font-medium">
                Intelligent financial management with AI-powered insights, real-time risk scoring, and personalized eligibility predictions.
              </p>
              <div className="flex gap-6">
                {['twitter', 'linkedin', 'github', 'instagram'].map(social => (
                  <div key={social} className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:-translate-y-2 cursor-pointer transition-all duration-300 shadow-sm">
                    <span className="capitalize text-xs font-black">{social[0]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-black text-slate-900 mb-10 uppercase tracking-[0.2em] text-xs">Product</h4>
              <ul className="space-y-6 text-slate-500 font-bold text-sm uppercase tracking-widest">
                <li><a href="#features" className="hover:text-indigo-600 transition">Features</a></li>
                <li><a href="#why-kredia" className="hover:text-indigo-600 transition">Why Kredia</a></li>
                <li><a href="#trust" className="hover:text-indigo-600 transition">Security</a></li>
                <li><Link to="/contact" className="hover:text-indigo-600 transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-slate-900 mb-10 uppercase tracking-[0.2em] text-xs">Company</h4>
              <ul className="space-y-6 text-slate-500 font-bold text-sm uppercase tracking-widest">
                <li><a href="#" className="hover:text-indigo-600 transition">About</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition">Terms</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                © 2026 Kredia. All rights reserved.
              </p>
              <div className="flex gap-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                <a href="#" className="hover:text-slate-600 transition">System Status</a>
                <a href="#" className="hover:text-slate-600 transition">Compliance</a>
                <a href="#" className="hover:text-slate-600 transition">Documentation</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

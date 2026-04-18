import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await API.post('/auth/login', { email, password });
      login(data.user, data.token);

      if (data.user.role === 'Department') {
        navigate('/department', { replace: true });
      } else {
        navigate('/lab', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-['Outfit'] selection:bg-blue-100 selection:text-blue-900">
      {/* Left panel - Visual Showpiece */}
      <div className="hidden lg:flex lg:w-[55%] bg-[#1a1a2e] p-12 flex-col justify-between relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

        {/* Logo Section */}
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center backdrop-blur-xl">
            <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">LabFlow</span>
        </div>

        {/* Center Content with Glassmorphism Card */}
        <div className="relative flex flex-col items-center">
            <div className="glass-card p-10 rounded-3xl max-w-lg border border-white/10 bg-white/5 backdrop-blur-2xl">
                <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
                    Manage Your <span className="gradient-text">Labs</span> <br />Efficiently
                </h1>
                <p className="text-slate-300 text-lg leading-relaxed mb-8">
                    Modernized asset tracking and resource management for engineering excellence.
                </p>
                
                <div className="space-y-4">
                    {[
                        'Real-time equipment monitoring',
                        'Streamlined registration flow',
                        'Role-based administrative dashboards'
                    ].map((f) => (
                        <div key={f} className="flex items-center gap-4">
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-slate-200 font-medium">{f}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Footer info */}
        <div className="relative flex justify-between items-center border-t border-white/5 pt-8">
          <p className="text-slate-500 text-sm font-medium">© 2024 Engineering College</p>
          <div className="flex gap-6">
            <span className="text-slate-400 text-sm hover:text-white transition-colors cursor-pointer">Support</span>
            <span className="text-slate-400 text-sm hover:text-white transition-colors cursor-pointer">Privacy</span>
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative bg-[#f8fafc]">
        {/* Decorative element for mobile */}
        <div className="lg:hidden absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>
        
        <div className="w-full max-w-[420px] space-y-10">
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 mt-3 text-lg font-medium">Please enter your details to sign in</p>
          </div>

          {/* Action Card for Registration */}
          <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl flex items-center justify-between group hover:bg-blue-50 transition-all duration-300">
            <div>
              <p className="font-bold text-blue-900">New equipment arrived?</p>
              <p className="text-sm text-blue-700/70 font-medium leading-tight mt-0.5">Register assets without logging in</p>
            </div>
            <Link 
              to="/register-equipment" 
              className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl animate-shake">
                <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm font-semibold">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@college.edu"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative group">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-base shadow-xl shadow-blue-600/30"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Logging in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Sample credentials hint */}
          <div className="p-6 bg-slate-100 rounded-3xl border border-slate-200">
            <p className="text-sm font-black text-slate-800 mb-3 ml-1 uppercase tracking-wider opacity-60">Test Credentials</p>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center group">
                    <span className="text-slate-500 font-medium">Department</span>
                    <span className="text-slate-900 font-bold bg-white px-3 py-1 rounded-lg border border-slate-200 group-hover:border-blue-300 transition-colors">dept.it@college.edu / dept@123</span>
                </div>
                <div className="flex justify-between items-center group">
                    <span className="text-slate-500 font-medium">Lab Admin</span>
                    <span className="text-slate-900 font-bold bg-white px-3 py-1 rounded-lg border border-slate-200 group-hover:border-blue-300 transition-colors">dbms.lab@college.edu / lab@123</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

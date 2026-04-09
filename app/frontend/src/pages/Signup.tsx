import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setShowWelcome, setUser } = (useAuth() as any);

  return (
    <div className="min-h-screen bg-bone flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white w-full max-w-[1400px] h-[90vh] md:h-[85vh] min-h-[600px] rounded-[3rem] shadow-2xl shadow-charcoal/5 overflow-hidden grid grid-cols-1 lg:grid-cols-2"
      >
        
        {/* Left: Form Section */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center relative h-full overflow-y-auto">
          <Link to="/" className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-charcoal/60 hover:text-charcoal transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </Link>

          <div className="max-w-sm mx-auto w-full mt-4 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <h1 className="font-serif text-3xl md:text-4xl text-charcoal mb-4">Create Account</h1>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                if (!fullName || !email || !password) {
                  setError('Please fill name, email and password');
                  return;
                }
                setLoading(true);
                try {
                  const res: any = await apiFetch('/signup', { method: 'POST', body: JSON.stringify({ email, password, full_name: fullName, role }) });
                  const token = res?.access_token;
                  if (!token) throw new Error('No token returned');
                  localStorage.setItem('sms_token', token);
                  // fetch /me to populate context
                  const me = await apiFetch('/me');
                  const restoredUser = { fullName: (me as any).full_name || '', email: (me as any).email, role: (me as any).role };
                  try { setUser(restoredUser); } catch {};
                  try { setShowWelcome(true); setTimeout(() => setShowWelcome(false), 3000); } catch {}
                  navigate('/dashboard');
                } catch (err: any) {
                  setError(err?.message || err?.body || 'Signup failed');
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-charcoal/50 font-bold">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30" />
                  <input 
                    type="text" 
                    placeholder="Enter your name" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-bone/30 border border-charcoal/10 rounded-xl py-3 pl-10 pr-4 text-sm text-charcoal placeholder:text-charcoal/30 outline-none focus:border-charcoal/30 focus:bg-bone/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-charcoal/50 font-bold">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30" />
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-bone/30 border border-charcoal/10 rounded-xl py-3 pl-10 pr-4 text-sm text-charcoal placeholder:text-charcoal/30 outline-none focus:border-charcoal/30 focus:bg-bone/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-charcoal/50 font-bold">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Create a password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-bone/30 border border-charcoal/10 rounded-xl py-3 pl-10 pr-10 text-sm text-charcoal placeholder:text-charcoal/30 outline-none focus:border-charcoal/30 focus:bg-bone/50 transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select value={role} onChange={(e) => setRole(e.target.value)} className="p-3 rounded-xl border bg-bone text-sm">
                  <option value="User">Customer</option>
                  <option value="Owner">Owner</option>
                </select>
                <button disabled={loading} className="flex-1 bg-charcoal text-white py-3.5 rounded-xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-black transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60">
                  {loading ? 'Creating…' : 'Sign Up'}
                </button>
              </div>
              {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-charcoal/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="px-4 bg-white text-charcoal/40 uppercase tracking-widest">Or sign up with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 border border-charcoal/10 py-2.5 rounded-xl hover:bg-bone/50 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="text-[10px] font-bold text-charcoal/80 uppercase tracking-wider">Google</span>
                </button>
                <button className="flex items-center justify-center gap-2 border border-charcoal/10 py-2.5 rounded-xl hover:bg-bone/50 transition-colors">
                  <svg className="w-4 h-4 text-charcoal" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 3.9-1.02 1.29.05 2.55.57 3.43 1.48-3.1 1.88-2.57 5.86.53 7.15-.58 1.54-1.47 3.08-2.94 4.62zm-3.67-17.4c.53 1.29-.13 2.8-1.5 3.48-.9.46-2.28.24-2.8-1.15-.46-1.24.21-2.77 1.48-3.37.95-.49 2.3-.26 2.82 1.04z" />
                  </svg>
                  <span className="text-[10px] font-bold text-charcoal/80 uppercase tracking-wider">Apple</span>
                </button>
              </div>

              <p className="text-center mt-6 text-[10px] text-charcoal/60">
                Already have an account? <Link to="/login" className="text-charcoal font-bold hover:underline">Log in</Link>
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right: Image Section */}
        <div className="relative hidden lg:block h-full">
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <img 
              src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop" 
              alt="Luxury Apartment" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </motion.div>

          {/* Testimonial Card */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="absolute bottom-12 left-12 right-12 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl text-white"
          >
            <p className="font-serif text-xl leading-relaxed mb-6">
              "Finding a verified, high-quality apartment used to be a nightmare. XOOMS made it seamless, transparent, and surprisingly delightful."
            </p>
            <div className="flex justify-between items-end">
              <div>
                <p className="font-bold text-lg">Elena Rodriguez</p>
                <p className="text-white/60 text-xs uppercase tracking-wider">Digital Nomad</p>
              </div>
              <div className="flex gap-4">
                <button className="p-2 rounded-full border border-white/20 hover:bg-white hover:text-charcoal transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-full border border-white/20 hover:bg-white hover:text-charcoal transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
}

import { motion } from 'motion/react';
import { User, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 md:py-6 backdrop-blur-[20px] bg-bone/50 border-b border-charcoal/5"
    >
      {/* Left: Wordmark */}
      <div className="flex-1">
        <Link to="/" className="text-2xl font-bold tracking-tighter uppercase font-sans text-charcoal">
          XOOMS
        </Link>
      </div>

      {/* Center: Links */}
      <div className="hidden md:flex flex-1 justify-center gap-8">
        {[
          { label: 'Home', path: '/' },
          { label: 'Properties', path: '/search?reset=true' },
          { label: 'About', path: '/about' }
        ].map((item) => (
          <Link 
            key={item.label} 
            to={item.path}
            className="text-[10px] font-medium uppercase tracking-[0.2em] text-charcoal/80 hover:text-charcoal transition-colors relative group"
          >
            {item.label}
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-charcoal transition-all duration-300 group-hover:w-full" />
          </Link>
        ))}
      </div>

      {/* Right: CTA & User */}
      <div className="flex-1 flex justify-end items-center gap-6">
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2">
              <Link to={user?.role === "Admin" ? "/admin-dashboard" : "/dashboard"}>
                <div className="w-9 h-9 bg-charcoal text-white rounded-full flex items-center justify-center hover:bg-black transition-colors">
                  <span className="text-xs font-bold">
                    {user?.fullName?.charAt(0) || user?.email?.charAt(0)}
                  </span>
                </div>
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-charcoal/5 text-charcoal/60 hover:text-charcoal transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link to="/login">
              <div 
                className="flex items-center gap-2 bg-charcoal text-white px-4 py-2 rounded-full hover:bg-black transition-colors"
              >
                <User className="w-3 h-3" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Login</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

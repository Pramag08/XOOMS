/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import SmoothScroll from './components/SmoothScroll';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Search from './pages/Search';
import PropertyDetail from './pages/PropertyDetail';
import BookingDetail from './pages/BookingDetail';
import OwnerProperty from './pages/OwnerProperty';
import Login from './pages/Login';
import Signup from './pages/Signup';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import MyProperties from './pages/MyProperties';
import AddProperty from './pages/AddProperty';
import WelcomeScreen from './components/WelcomeScreen';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminDashboard from "./pages/AdminDashboard";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [pathname, hash]);

  return null;
}

function AppContent() {
  const location = useLocation();
  const { showWelcome, user } = useAuth();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="bg-bone min-h-screen selection:bg-charcoal selection:text-white relative">
      {showWelcome && user && <WelcomeScreen name={user.fullName} />}
      
      {!isLoginPage && <Navbar />}
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/about" element={<About />} />
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/booking/:id" element={<BookingDetail />} />
        <Route path="/owner/properties/:id" element={<OwnerProperty />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-properties" element={<MyProperties />} />
        <Route path="/my-properties/add" element={<AddProperty />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
      
      {!isLoginPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <SmoothScroll>
          <ScrollToTop />
          <AppContent />
        </SmoothScroll>
      </Router>
    </AuthProvider>
  );
}


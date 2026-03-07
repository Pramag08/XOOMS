import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  fullName: string;
  email: string;
  verificationStatus: 'Verified' | 'Unverified';
}

interface AuthContextType {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const login = (email: string) => {
    // Mock login logic
    if (email === 'basantiapramag@gmail.com') {
      const mockUser: User = {
        fullName: 'Basantia Pramag', // Inferring name from email for now, or could be hardcoded
        email: email,
        verificationStatus: 'Verified'
      };
      setUser(mockUser);
      setShowWelcome(true);
      
      // Hide welcome screen after 3 seconds
      setTimeout(() => {
        setShowWelcome(false);
      }, 3000);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, showWelcome, setShowWelcome }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

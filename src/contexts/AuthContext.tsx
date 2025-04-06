import React, { createContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '../types/auth';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signIn = async (email: string, password: string) => {
    // Mock sign in
    setUser({
      uid: '1',
      email: email,
      displayName: 'Test User'
    });
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    // Mock sign up
    setUser({
      uid: '1',
      email: email,
      displayName: displayName
    });
  };

  const signOut = async () => {
    // Mock sign out
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    // Mock reset password
    console.log('Password reset email sent to:', email);
  };

  useEffect(() => {
    // Mock auth state change
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 
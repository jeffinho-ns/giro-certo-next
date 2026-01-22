'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { apiClient } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar token do localStorage
    const loadUser = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        apiClient.setToken(storedToken);
        // Buscar dados do usuário
        try {
          const response = await apiClient.get<{ user: User }>('/api/users/me/profile');
          setUser(response.user);
        } catch (error) {
          console.error('Erro ao carregar usuário:', error);
          // Se der erro, limpar token
          localStorage.removeItem('auth_token');
          setToken(null);
          apiClient.setToken(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      if (response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        apiClient.setToken(response.token);
        // Salvar token no localStorage
        localStorage.setItem('auth_token', response.token);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer login');
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setUser(null);
      setToken(null);
      apiClient.setToken(null);
    }
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isModerator = user?.role === UserRole.MODERATOR || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated,
        isAdmin,
        isModerator,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

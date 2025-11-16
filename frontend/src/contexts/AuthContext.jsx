import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import apiMock from '../services/apiMock';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));

  useEffect(() => {
    // Verificar token al cargar la aplicación
    const verifyToken = async () => {
      if (token) {
        try {
          try {
            const response = await fetch('https://clinica-dental-backend.onrender.com/api/auth/profile', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              setUser(userData.user);
              return;
            }
          } catch (backendError) {
            console.log('Backend no disponible para verificación de token, usando mock:', backendError.message);
          }

          // Fallback al mock API
          const mockResult = await apiMock.getProfile(token);
          if (mockResult.success) {
            setUser(mockResult.user);
          } else {
            throw new Error('Token inválido');
          }
        } catch (error) {
          console.error('Error verificando token:', error);
          localStorage.removeItem('auth_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (email, password) => {
    try {
      // Intentar con el backend real primero
      try {
        const response = await fetch('https://clinica-dental-backend.onrender.com/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
          const { token: newToken, user: userData } = data;
          localStorage.setItem('auth_token', newToken);
          setToken(newToken);
          setUser(userData);
          return { success: true };
        }
      } catch (backendError) {
        console.log('Backend no disponible, usando mock API:', backendError.message);
      }

      // Fallback al mock API
      const mockResult = await apiMock.login({ email, password });
      localStorage.setItem('auth_token', mockResult.token);
      setToken(mockResult.token);
      setUser(mockResult.user);
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-h3">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
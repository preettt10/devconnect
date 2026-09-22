/* eslint-disable react-refresh/only-export-components */
// ============================================================
// src/context/AuthContext.jsx
// Stores: { user, accessToken, isLoading }
// Exposes: login(), logout(), updateUser()
// ============================================================


import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import api, { clearAccessToken, setAccessToken } from '../api/axios.js';

// ---- State shape ----
const initialState = {
  user: null,
  isLoading: true, // True until initial session check completes
  isAuthenticated: false,
};

// ---- Reducer ----
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// ---- Context ----
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ---- On mount: try to restore session via refresh token cookie ----
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.accessToken;
        setAccessToken(newToken);

        // Fetch current user
        const userRes = await api.get('/auth/me');
        dispatch({ type: 'LOGIN', payload: { user: userRes.data.data.user } });
      } catch {
        // No valid refresh token — user is logged out
        dispatch({ type: 'LOGOUT' });
      }
    };

    restoreSession();
  }, []);

  // ---- login(): called after successful login API response ----
  const login = useCallback((user, token) => {
    setAccessToken(token);
    dispatch({ type: 'LOGIN', payload: { user } });
  }, []);

  // ---- logout(): calls API then clears local state ----
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if the call fails, clear local state
    } finally {
      clearAccessToken();
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // ---- updateUser(): merges partial updates into user object ----
  const updateUser = useCallback((updates) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        isLoading: state.isLoading,
        isAuthenticated: state.isAuthenticated,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ---- Custom hook ----
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { governmentAPI } from '../services/api';

interface Government {
  _id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  accessLevel: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface GovernmentAuthState {
  government: Government | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type GovernmentAuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { government: Government; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

interface GovernmentAuthContextType extends GovernmentAuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const initialState: GovernmentAuthState = {
  government: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const governmentAuthReducer = (state: GovernmentAuthState, action: GovernmentAuthAction): GovernmentAuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        government: action.payload.government,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        government: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        government: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const GovernmentAuthContext = createContext<GovernmentAuthContextType | undefined>(undefined);

export const useGovernmentAuth = (): GovernmentAuthContextType => {
  const context = useContext(GovernmentAuthContext);
  if (!context) {
    throw new Error('useGovernmentAuth must be used within a GovernmentAuthProvider');
  }
  return context;
};

interface GovernmentAuthProviderProps {
  children: ReactNode;
}

export const GovernmentAuthProvider: React.FC<GovernmentAuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(governmentAuthReducer, initialState);

  // Check for existing token on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('governmentToken');
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await governmentAPI.getProfile();
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              government: response.data.data.government,
              token,
            },
          });
        } catch (error: any) {
          console.error('Government auth check failed:', error);
          localStorage.removeItem('governmentToken');
          dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired. Please login again.' });
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: '' });
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await governmentAPI.login({ email, password });
      localStorage.setItem('governmentToken', response.data.data.token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          government: response.data.data.government,
          token: response.data.data.token,
        },
      });
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.response?.data?.message || 'Login failed',
      });
    }
  };

  const logout = (): void => {
    localStorage.removeItem('governmentToken');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: GovernmentAuthContextType = {
    ...state,
    login,
    logout,
    clearError,
  };

  return (
    <GovernmentAuthContext.Provider value={value}>
      {children}
    </GovernmentAuthContext.Provider>
  );
};















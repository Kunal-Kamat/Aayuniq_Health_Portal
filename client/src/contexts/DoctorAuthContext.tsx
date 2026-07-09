import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { doctorAPI } from '../services/api';

// Doctor interface
export interface Doctor {
  doctorId: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  hospital: string;
  experience: number;
  qualifications: string[];
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
}

// Auth state interface
interface DoctorAuthState {
  doctor: Doctor | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth context type
interface DoctorAuthContextType extends DoctorAuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Auth actions
type DoctorAuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { doctor: Doctor; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: DoctorAuthState = {
  doctor: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth reducer
const doctorAuthReducer = (state: DoctorAuthState, action: DoctorAuthAction): DoctorAuthState => {
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
        doctor: action.payload.doctor,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        doctor: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        doctor: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
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

// Create context
const DoctorAuthContext = createContext<DoctorAuthContextType | undefined>(undefined);

// Provider props interface
interface DoctorAuthProviderProps {
  children: ReactNode;
}

export const DoctorAuthProvider: React.FC<DoctorAuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(doctorAuthReducer, initialState);

  // Check if doctor is logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('doctorToken');
      console.log('DoctorAuthContext: Checking auth status, token exists:', !!token);
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await doctorAPI.getProfile();
          console.log('DoctorAuthContext: Profile check successful:', response.data);
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              doctor: response.data.data.doctor,
              token,
            },
          });
        } catch (error) {
          console.log('DoctorAuthContext: Profile check failed:', error);
          localStorage.removeItem('doctorToken');
          dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
        }
      } else {
        console.log('DoctorAuthContext: No token found, setting loading to false');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('DoctorAuthContext: Starting login process');
      dispatch({ type: 'AUTH_START' });
      const response = await doctorAPI.login({ email, password });
      console.log('DoctorAuthContext: Login API response:', response.data);
      localStorage.setItem('doctorToken', response.data.data.token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          doctor: response.data.data.doctor,
          token: response.data.data.token,
        },
      });
      console.log('DoctorAuthContext: Login successful, state updated');
    } catch (error: any) {
      console.error('DoctorAuthContext: Login failed:', error);
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.response?.data?.message || 'Login failed',
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('doctorToken');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: DoctorAuthContextType = {
    ...state,
    login,
    logout,
    clearError,
  };

  return (
    <DoctorAuthContext.Provider value={value}>
      {children}
    </DoctorAuthContext.Provider>
  );
};

// Custom hook to use doctor auth context
export const useDoctorAuth = (): DoctorAuthContextType => {
  const context = useContext(DoctorAuthContext);
  if (context === undefined) {
    throw new Error('useDoctorAuth must be used within a DoctorAuthProvider');
  }
  return context;
};

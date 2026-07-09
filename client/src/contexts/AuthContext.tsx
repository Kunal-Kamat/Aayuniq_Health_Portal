import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface Patient {
  patientId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  height?: number;
  weight?: number;
  bloodGroup?: string;
  allergies: string[];
  medicalIssues: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  age?: number;
  lastLogin?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  patient: Patient | null;
  token: string | null;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { patient: Patient; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

interface AuthContextType extends AuthState {
  login: (patientId: string, phone: string) => Promise<void>;
  verifyLoginOTP: (patientId: string, otp: string) => Promise<void>;
  register: (patientData: any) => Promise<any>;
  verifyRegistrationOTP: (patientId: string, otp: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updatePatient: (patientData: Partial<Patient>) => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  patient: null,
  token: localStorage.getItem('token'),
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
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
        isAuthenticated: true,
        isLoading: false,
        patient: action.payload.patient,
        token: action.payload.token,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        patient: null,
        token: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        patient: null,
        token: null,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await authAPI.getProfile();
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              patient: response.data.data.patient,
              token,
            },
          });
        } catch (error) {
          localStorage.removeItem('token');
          dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (patientId: string, phone: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      await authAPI.login({ patientId, phone });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.response?.data?.message || 'Login failed',
      });
    }
  };

  const verifyLoginOTP = async (patientId: string, otp: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.verifyLoginOTP({ patientId, otp });
      localStorage.setItem('token', response.data.data.token);
      console.log('Login OTP verification - patient data:', response.data.data.patient);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          patient: response.data.data.patient,
          token: response.data.data.token,
        },
      });
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.response?.data?.message || 'OTP verification failed',
      });
    }
  };

  const register = async (patientData: any) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.register(patientData);
      dispatch({ type: 'SET_LOADING', payload: false });
      return response.data; // Return the response data including patientId
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.response?.data?.message || 'Registration failed',
      });
      throw error; // Re-throw to handle in component
    }
  };

  const verifyRegistrationOTP = async (patientId: string, otp: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.verifyOTP({ patientId, otp });
      localStorage.setItem('token', response.data.data.token);
      console.log('Registration OTP verification - patient data:', response.data.data.patient);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          patient: response.data.data.patient,
          token: response.data.data.token,
        },
      });
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.response?.data?.message || 'OTP verification failed',
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updatePatient = (patientData: Partial<Patient>) => {
    if (state.patient) {
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          patient: { ...state.patient, ...patientData },
          token: state.token!,
        },
      });
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    verifyLoginOTP,
    register,
    verifyRegistrationOTP,
    logout,
    clearError,
    updatePatient,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

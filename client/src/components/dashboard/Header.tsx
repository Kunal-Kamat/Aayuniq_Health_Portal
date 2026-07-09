import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

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

interface HeaderProps {
  patient: Patient;
}

const Header: React.FC<HeaderProps> = ({ patient }) => {
  const { logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white shadow-sm border-b border-medical-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex items-center space-x-3"
            >
              <div className="h-10 w-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-medical-900">Aayuniq Health Portal</h1>
                <p className="text-sm text-medical-600">Your Health, Your Data</p>
              </div>
            </motion.div>
          </div>

          {/* Patient Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* Patient Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden md:flex items-center space-x-3"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-medical-900">{getGreeting()}, {patient.name.split(' ')[0]}</p>
                <p className="text-xs text-medical-600">Patient ID: {patient.patientId}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {getInitials(patient.name)}
              </div>
            </motion.div>

            {/* Logout Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-medical-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Patient Info */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ delay: 0.5 }}
        className="md:hidden border-t border-medical-200 bg-medical-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold">
              {getInitials(patient.name)}
            </div>
            <div>
              <p className="text-sm font-medium text-medical-900">{getGreeting()}, {patient.name}</p>
              <p className="text-xs text-medical-600">Patient ID: {patient.patientId}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
};

export default Header;

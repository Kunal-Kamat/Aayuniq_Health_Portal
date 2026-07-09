import React from 'react';
import { Navigate } from 'react-router-dom';
import { useDoctorAuth } from '../contexts/DoctorAuthContext';

interface DoctorProtectedRouteProps {
  children: React.ReactNode;
}

const DoctorProtectedRoute: React.FC<DoctorProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, doctor, token } = useDoctorAuth();

  console.log('DoctorProtectedRoute: isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'doctor:', doctor, 'token:', token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <div className="loading-dots mx-auto mb-4">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p className="text-white font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('DoctorProtectedRoute: Not authenticated, redirecting to doctor login');
    return <Navigate to="/doctor/login" replace />;
  }

  console.log('DoctorProtectedRoute: Authenticated, rendering children');
  return <>{children}</>;
};

export default DoctorProtectedRoute;

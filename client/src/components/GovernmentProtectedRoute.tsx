import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGovernmentAuth } from '../contexts/GovernmentAuthContext';
import LoadingSpinner from './common/LoadingSpinner';

interface GovernmentProtectedRouteProps {
  children: ReactNode;
}

const GovernmentProtectedRoute: React.FC<GovernmentProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useGovernmentAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/government/login" replace />;
  }

  return <>{children}</>;
};

export default GovernmentProtectedRoute;















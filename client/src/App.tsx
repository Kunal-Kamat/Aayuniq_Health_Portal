import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DoctorAuthProvider } from './contexts/DoctorAuthContext';
import { GovernmentAuthProvider } from './contexts/GovernmentAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DoctorProtectedRoute from './components/DoctorProtectedRoute';
import GovernmentProtectedRoute from './components/GovernmentProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOTP from './pages/auth/VerifyOTP';
import DoctorLogin from './pages/auth/DoctorLogin';
import GovernmentLogin from './pages/auth/GovernmentLogin';
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientList from './pages/doctor/PatientList';
import PatientDetails from './pages/doctor/PatientDetails';
import AddMedicalRecord from './pages/doctor/AddMedicalRecord';
import AddPatient from './pages/doctor/AddPatient';
import GovernmentDashboard from './pages/government/GovernmentDashboard';
import Landing from './pages/Landing';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <DoctorAuthProvider>
        <GovernmentAuthProvider>
          <Router>
          <div className="min-h-screen gradient-bg">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/doctor/login" element={<DoctorLogin />} />
              <Route path="/government/login" element={<GovernmentLogin />} />
              
              {/* Patient protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <PatientDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Doctor protected routes */}
              <Route 
                path="/doctor/dashboard" 
                element={
                  <DoctorProtectedRoute>
                    <DoctorDashboard />
                  </DoctorProtectedRoute>
                } 
              />
              <Route 
                path="/doctor/patients" 
                element={
                  <DoctorProtectedRoute>
                    <PatientList />
                  </DoctorProtectedRoute>
                } 
              />
              <Route 
                path="/doctor/patients/:patientId" 
                element={
                  <DoctorProtectedRoute>
                    <PatientDetails />
                  </DoctorProtectedRoute>
                } 
              />
              <Route 
                path="/doctor/patients/:patientId/add-record" 
                element={
                  <DoctorProtectedRoute>
                    <AddMedicalRecord />
                  </DoctorProtectedRoute>
                } 
              />
              <Route 
                path="/doctor/patients/new" 
                element={
                  <DoctorProtectedRoute>
                    <AddPatient />
                  </DoctorProtectedRoute>
                } 
              />
              
              {/* Government protected routes */}
              <Route 
                path="/government/dashboard" 
                element={
                  <GovernmentProtectedRoute>
                    <GovernmentDashboard />
                  </GovernmentProtectedRoute>
                } 
              />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
        </GovernmentAuthProvider>
      </DoctorAuthProvider>
    </AuthProvider>
  );
}

export default App;

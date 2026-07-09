import React, { useState, useEffect } from 'react';
import { useDoctorAuth } from '../../contexts/DoctorAuthContext';
import { doctorAPI } from '../../services/api';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalPatients: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const PatientList: React.FC = () => {
  const { doctor, logout } = useDoctorAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPatients();
  }, [currentPage]);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const response = await doctorAPI.getPatients(currentPage, 10);
      setPatients(response.data.data.patients);
      setPagination(response.data.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch patients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPatient = (patientId: string) => {
    navigate(`/doctor/patients/${patientId}`);
  };

  const handleAddRecord = (patientId: string) => {
    navigate(`/doctor/patients/${patientId}/add-record`);
  };

  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="loading-dots mx-auto mb-4">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p className="text-gray-600 font-medium">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-blue-600 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/doctor/dashboard')}
                className="mr-4 text-white hover:text-blue-200 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mr-3">
                <span className="text-xl">👥</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Patient List</h1>
                <p className="text-white/90">Manage your patients</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <p className="text-red-700">{error}</p>
          </motion.div>
        )}

        {/* Patient List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">My Patients</h2>
                <p className="text-gray-600 mt-1">
                  {pagination?.totalPatients || 0} patients assigned to you
                </p>
              </div>
              <button
                onClick={() => navigate('/doctor/patients/new')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                + Add Medical Record
              </button>
            </div>
          </div>

          {patients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-500 text-lg mb-2">No patients assigned yet</p>
              <p className="text-gray-400 text-sm mb-6">Patients will appear here after you create medical records for them</p>
              <button
                onClick={() => navigate('/doctor/patients/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
              >
                Add Medical Record
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {patients.map((patient, index) => (
                <motion.div
                  key={patient.patientId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-xl">👤</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {patient.name}
                          </h3>
                          <p className="text-gray-600">ID: {patient.patientId}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">
                              📧 {patient.email}
                            </span>
                            <span className="text-sm text-gray-500">
                              📞 {patient.phone}
                            </span>
                            <span className="text-sm text-gray-500">
                              🎂 {patient.age || 'N/A'} years
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleViewPatient(patient.patientId)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleAddRecord(patient.patientId)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        Add Record
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PatientList;

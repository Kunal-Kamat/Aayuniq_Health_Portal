import React, { useState, useEffect } from 'react';
import { useDoctorAuth } from '../../contexts/DoctorAuthContext';
import { doctorAPI } from '../../services/api';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalPatients: number;
  totalMedicalRecords: number;
}

interface PopulatedMedicalRecord {
  _id: string;
  patientId: {
    name: string;
    patientId: string;
  };
  visitDate: string;
  diagnosis: string;
  treatment: string;
  doctorName: string;
  doctorSpecialty?: string;
  symptoms: string[];
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
  }>;
  vitalSigns?: {
    bloodPressure?: {
      systolic: number;
      diastolic: number;
    };
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  labResults: Array<{
    testName: string;
    result: string;
    normalRange?: string;
    unit?: string;
    date: string;
  }>;
  notes?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  bmi?: number;
}

const DoctorDashboard: React.FC = () => {
  const { doctor, logout } = useDoctorAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRecords, setRecentRecords] = useState<PopulatedMedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure we don't duplicate the "Dr." prefix if it's already present in the stored name
  const getDoctorDisplayName = (): string => {
    const rawName = doctor?.name || '';
    const nameWithoutPrefix = rawName.replace(/^\s*Dr\.?\s+/i, '');
    return `Dr. ${nameWithoutPrefix}`.trim();
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await doctorAPI.getDashboard();
        setStats(response.data.data.statistics);
        setRecentRecords(response.data.data.recentRecords as unknown as PopulatedMedicalRecord[]);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleViewPatients = () => {
    navigate('/doctor/patients');
  };

  const handleAddRecord = () => {
    navigate('/doctor/patients/new');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="loading-dots mx-auto mb-4">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p className="text-black font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mr-3">
                <span className="text-xl">👨‍⚕️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">Doctor Dashboard</h1>
                <p className="text-black/80">Welcome back, {getDoctorDisplayName()}</p>
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
            className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6"
          >
            <p className="text-red-800">{error}</p>
          </motion.div>
        )}

        {/* Doctor Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-8 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-black mb-2">{getDoctorDisplayName()}</h2>
              <p className="text-black/80 text-lg">{doctor?.specialization}</p>
              <p className="text-black/60">{doctor?.hospital}</p>
              <p className="text-black/60">{doctor?.experience} years of experience</p>
            </div>
            <div className="text-right">
              <div className="text-black/60 text-sm">License Number</div>
              <div className="text-black font-mono">{doctor?.licenseNumber}</div>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className="h-12 w-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <p className="text-black/60 text-sm">Total Patients</p>
                <p className="text-3xl font-bold text-black">{stats?.totalPatients || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <p className="text-black/60 text-sm">Medical Records</p>
                <p className="text-3xl font-bold text-black">{stats?.totalMedicalRecords || 0}</p>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Recent Medical Records */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20"
        >
          <h3 className="text-xl font-bold text-black mb-6">Recent Medical Records</h3>
          
          {recentRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-black/60">No recent medical records found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRecords.map((record, index) => (
                <motion.div
                  key={record._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-black font-medium">
                        {record.patientId?.name} ({record.patientId?.patientId})
                      </h4>
                      <p className="text-black/80 text-sm mt-1">{record.diagnosis}</p>
                      <p className="text-black/60 text-sm mt-1">{record.treatment}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-black/60 text-sm">
                        {new Date(record.visitDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-gray-200"
        >
          <h3 className="text-xl font-bold text-black mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={handleViewPatients}
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors duration-200 text-left"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">👥</span>
                <div>
                  <p className="font-medium">View All Patients</p>
                  <p className="text-sm opacity-80">Browse patient list</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={handleAddRecord}
              className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors duration-200 text-left"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📝</span>
                <div>
                  <p className="font-medium">Add Medical Record</p>
                  <p className="text-sm opacity-80">Create new record</p>
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DoctorDashboard;

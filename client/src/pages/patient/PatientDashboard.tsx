import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { patientAPI } from '../../services/api';
import Header from '../../components/dashboard/Header';
import PatientInfoCard from '../../components/dashboard/PatientInfoCard';
import MedicalHistoryTimeline from '../../components/dashboard/MedicalHistoryTimeline';
import ActionsSection from '../../components/dashboard/ActionsSection';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface MedicalRecord {
  _id: string;
  visitDate: string;
  doctorName: string;
  doctorSpecialty?: string;
  diagnosis: string;
  symptoms: string[];
  treatment?: string;
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


const PatientDashboard: React.FC = () => {
  const { patient, logout } = useAuth();
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await patientAPI.getMedicalRecords(1, 20);
      setMedicalRecords(response.data.data.medicalRecords);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch medical records');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setIsDownloading(true);
      setError(null); // Clear any previous errors
      
      console.log('Starting download report for patient:', patient?.patientId);
      const response = await patientAPI.downloadReport();
      
      console.log('Download response received:', response);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Verify blob size
      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `health-report-${patient?.patientId}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Report downloaded successfully');
    } catch (err: any) {
      console.error('Download report error:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to download report';
      setError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!patient) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen gradient-bg">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-red-400 hover:text-red-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Header patient={patient} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Patient Info */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <PatientInfoCard patient={patient} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ActionsSection
                onDownloadReport={handleDownloadReport}
                onLogout={handleLogout}
                isDownloading={isDownloading}
              />
            </motion.div>
          </div>

          {/* Right Column - Medical History */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <MedicalHistoryTimeline
                records={medicalRecords}
                isLoading={isLoading}
                error={error}
                onRetry={fetchMedicalRecords}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Success Message for Download */}
      <AnimatePresence>
        {isDownloading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-4 right-4 z-50 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg"
          >
            <div className="flex items-center">
              <div className="spinner mr-2"></div>
              <span className="text-sm font-medium">Generating your health report...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientDashboard;

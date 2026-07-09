import React, { useState, useEffect } from 'react';
import { useGovernmentAuth } from '../../contexts/GovernmentAuthContext';
import { governmentAPI } from '../../services/api';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface DashboardData {
  overview: {
    totalPatients: number;
    totalDoctors: number;
    totalMedicalRecords: number;
  };
  diseaseDistribution: Array<{
    disease: string;
    count: number;
    uniquePatients: number;
    percentage: number;
  }>;
  ageGroupDistribution: Array<{
    _id: string;
    count: number;
  }>;
  genderDistribution: Array<{
    _id: string;
    count: number;
  }>;
  specializationDistribution: Array<{
    _id: string;
    count: number;
  }>;
}

const GovernmentDashboard: React.FC = () => {
  const { government, logout } = useGovernmentAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading dashboard...');

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await governmentAPI.getDashboard();
      setDashboardData(response.data.data);
      setError(null);
    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      setError(error.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatientRecords = async () => {
    try {
      setIsLoadingPatients(true);
      setLoadingMessage('Loading patient records...');
      const response = await governmentAPI.getPatients({
        page: 1,
        limit: 20
      });
      setPatientRecords(response.data.data.records);
    } catch (error: any) {
      console.error('Patient records fetch error:', error);
      setError(error.response?.data?.message || 'Failed to fetch patient records');
    } finally {
      setIsLoadingPatients(false);
      setLoadingMessage('Loading dashboard...');
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setIsDownloadingExcel(true);
      const response = await governmentAPI.exportExcel();
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `patient-records-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Excel download error:', error);
      setError(error.response?.data?.message || 'Failed to download Excel file');
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const togglePatientDetails = () => {
    setShowPatientDetails(!showPatientDetails);
    if (!showPatientDetails) {
      fetchPatientRecords();
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Government Dashboard</h1>
              <p className="text-blue-100">
                Welcome, {government?.name} • {government?.department}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={fetchDashboardData}
                disabled={isLoading}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                title="Refresh Dashboard Data"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Refresh</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadExcel}
                disabled={isDownloadingExcel}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                title="Download Patient Records as Excel"
              >
                {isDownloadingExcel ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>📊</span>
                    <span>Export Excel</span>
                  </>
                )}
              </button>
              <button
                onClick={togglePatientDetails}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium border border-white/30"
              >
                {showPatientDetails ? 'Hide Patients' : 'View Patients'}
              </button>
              <button
                onClick={logout}
                className="bg-red-500/80 hover:bg-red-600/80 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium border border-red-400/50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData?.overview.totalPatients || 0}
                </p>
              </div>
              <div className="text-blue-500 text-3xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Doctors</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData?.overview.totalDoctors || 0}
                </p>
              </div>
              <div className="text-green-500 text-3xl">👨‍⚕️</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Medical Records</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData?.overview.totalMedicalRecords || 0}
                </p>
              </div>
              <div className="text-purple-500 text-3xl">📋</div>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8 mb-8"
        >
          {/* Disease Distribution Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Disease Distribution</h3>
            <ResponsiveContainer width="100%" height={500}>
              <PieChart>
                <Pie
                  data={dashboardData?.diseaseDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ disease, percentage }: any) => `${disease}: ${(percentage as number).toFixed(1)}%`}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(dashboardData?.diseaseDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#82CA9D', '#FFC658', '#FF7C7C', '#8884D8', '#FF6B6B', '#4ECDC4', '#FF9F40', '#36A2EB'][index % 8]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gender Distribution Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h3>
            <ResponsiveContainer width="100%" height={500}>
              <PieChart>
                <Pie
                  data={dashboardData?.genderDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, count }: any) => `${_id}: ${count}`}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(dashboardData?.genderDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#FF6B6B', '#4ECDC4', '#45B7D1'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Doctor Specialization Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Doctor Specializations</h3>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={dashboardData?.specializationDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4ECDC4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>


        {/* Patient Records Section */}
        {showPatientDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Patient Records</h3>
              <button
                onClick={fetchPatientRecords}
                disabled={isLoadingPatients}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoadingPatients ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Refresh</span>
                  </>
                )}
              </button>
            </div>

            {/* Patient Records Table */}
            {isLoadingPatients ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading patient records...</span>
              </div>
            ) : patientRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Treatment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Follow Up</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patientRecords.map((record, index) => (
                      <tr key={record._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{record.patientName || 'N/A'}</div>
                            <div className="text-sm text-gray-500">ID: {record.patientId || 'N/A'}</div>
                            <div className="text-sm text-gray-500">
                              {record.patientAge ? `${record.patientAge}y` : 'N/A'} • {record.patientGender || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.visitDate ? new Date(record.visitDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{record.doctorName || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{record.doctorSpecialty || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={record.diagnosis}>
                            {record.diagnosis || 'N/A'}
                          </div>
                          {record.symptoms && record.symptoms.length > 0 && (
                            <div className="text-sm text-gray-500 mt-1">
                              Symptoms: {record.symptoms.slice(0, 2).join(', ')}
                              {record.symptoms.length > 2 && ` +${record.symptoms.length - 2} more`}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={record.treatment}>
                            {record.treatment || 'N/A'}
                          </div>
                          {record.medications && record.medications.length > 0 && (
                            <div className="text-sm text-gray-500 mt-1">
                              Meds: {record.medications.slice(0, 2).map((med: any) => med.name).join(', ')}
                              {record.medications.length > 2 && ` +${record.medications.length - 2} more`}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.followUpRequired 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {record.followUpRequired ? 'Required' : 'Not Required'}
                          </span>
                          {record.followUpDate && (
                            <div className="text-sm text-gray-500 mt-1">
                              {new Date(record.followUpDate).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No patient records found</h3>
                <p className="text-gray-500">Try refreshing the page or contact support.</p>
              </div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default GovernmentDashboard;
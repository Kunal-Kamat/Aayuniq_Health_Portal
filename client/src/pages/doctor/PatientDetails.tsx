import React, { useState, useEffect } from 'react';
import { useDoctorAuth } from '../../contexts/DoctorAuthContext';
import { doctorAPI } from '../../services/api';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';

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
  age?: number;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface MedicalRecord {
  _id: string;
  patientId: string;
  visitDate: string;
  diagnosis: string;
  treatment?: string;
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

const PatientDetails: React.FC = () => {
  const { doctor } = useDoctorAuth();
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
    }
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      setIsLoading(true);
      const response = await doctorAPI.getPatient(patientId!);
      setPatient(response.data.data.patient);
      setMedicalRecords(response.data.data.medicalRecords);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch patient details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRecord = () => {
    navigate(`/doctor/patients/${patientId}/add-record`);
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
          <p className="text-gray-600 font-medium">Loading patient details...</p>
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
                onClick={() => navigate('/doctor/patients')}
                className="mr-4 text-white hover:text-blue-200 transition-colors"
              >
                ← Back to Patients
              </button>
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mr-3">
                <span className="text-xl">👤</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Patient Details</h1>
                <p className="text-white/90">
                  {patient ? patient.name : 'Loading...'}
                </p>
              </div>
            </div>
            <button
              onClick={handleAddRecord}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Add Medical Record
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

        {patient && (
          <>
            {/* Patient Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Patient Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-blue-600 mb-3 border-b border-blue-200 pb-2">Personal Details</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {patient.name}</p>
                    <p><span className="font-medium">Patient ID:</span> {patient.patientId}</p>
                    <p><span className="font-medium">Age:</span> {patient.age || 'N/A'} years</p>
                    <p><span className="font-medium">Gender:</span> {patient.gender}</p>
                    <p><span className="font-medium">Blood Group:</span> {patient.bloodGroup || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-green-600 mb-3 border-b border-green-200 pb-2">Contact Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Email:</span> {patient.email}</p>
                    <p><span className="font-medium">Phone:</span> {patient.phone}</p>
                  </div>
                </div>
                
                {patient.emergencyContact && (
                  <div>
                    <h3 className="text-lg font-bold text-red-600 mb-3 border-b border-red-200 pb-2">Emergency Contact</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Name:</span> {patient.emergencyContact.name}</p>
                      <p><span className="font-medium">Phone:</span> {patient.emergencyContact.phone}</p>
                      <p><span className="font-medium">Relationship:</span> {patient.emergencyContact.relationship}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg font-bold text-purple-600 mb-3 border-b border-purple-200 pb-2">Medical Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Height:</span> {patient.height ? `${patient.height} cm` : 'N/A'}</p>
                    <p><span className="font-medium">Weight:</span> {patient.weight ? `${patient.weight} kg` : 'N/A'}</p>
                    <p><span className="font-medium">Allergies:</span> {patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None'}</p>
                    <p><span className="font-medium">Medical Issues:</span> {patient.medicalIssues.length > 0 ? patient.medicalIssues.join(', ') : 'None'}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Medical Records */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Medical Records</h2>
                <span className="text-sm text-gray-500">{medicalRecords.length} records</span>
              </div>
              
              {medicalRecords.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-gray-500 text-lg">No medical records found</p>
                  <button
                    onClick={handleAddRecord}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Add First Record
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicalRecords.map((record, index) => (
                    <motion.div
                      key={record._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {new Date(record.visitDate).toLocaleDateString()}
                          </h3>
                          <p className="text-sm text-gray-600">Dr. {record.doctorName}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-500">
                            {record.doctorSpecialty || 'General Practice'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Diagnosis</h4>
                          <p className="text-gray-700 text-sm">{record.diagnosis}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Treatment</h4>
                          <p className="text-gray-700 text-sm">{record.treatment || 'No treatment specified'}</p>
                        </div>
                      </div>
                      
                      {record.symptoms.length > 0 && (
                        <div className="mt-3">
                          <h4 className="font-medium text-gray-900 mb-1">Symptoms</h4>
                          <p className="text-gray-700 text-sm">{record.symptoms.join(', ')}</p>
                        </div>
                      )}
                      
                      {record.medications.length > 0 && (
                        <div className="mt-3">
                          <h4 className="font-medium text-gray-900 mb-1">Medications</h4>
                          <div className="space-y-1">
                            {record.medications.map((med, idx) => (
                              <p key={idx} className="text-gray-700 text-sm">
                                {med.name} {med.dosage && `(${med.dosage})`} {med.frequency && `- ${med.frequency}`}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {record.notes && (
                        <div className="mt-3">
                          <h4 className="font-medium text-gray-900 mb-1">Notes</h4>
                          <p className="text-gray-700 text-sm">{record.notes}</p>
                        </div>
                      )}
                      
                      {record.followUpRequired && record.followUpDate && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-yellow-800 text-sm">
                            <span className="font-medium">Follow-up required:</span> {new Date(record.followUpDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientDetails;

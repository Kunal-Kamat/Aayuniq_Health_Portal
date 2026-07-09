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
}

interface MedicalRecordForm {
  visitDate: string;
  diagnosis: string;
  symptoms: string[];
  treatment: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  vitalSigns: {
    bloodPressure: {
      systolic: number;
      diastolic: number;
    };
    heartRate: number;
    temperature: number;
    weight: number;
    height: number;
  };
  labResults: Array<{
    testName: string;
    result: string;
    normalRange: string;
    unit: string;
    date: string;
  }>;
  notes: string;
  followUpRequired: boolean;
  followUpDate: string;
}

const AddMedicalRecord: React.FC = () => {
  const { doctor } = useDoctorAuth();
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<MedicalRecordForm>({
    visitDate: new Date().toISOString().split('T')[0],
    diagnosis: '',
    symptoms: [''],
    treatment: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    vitalSigns: {
      bloodPressure: { systolic: 0, diastolic: 0 },
      heartRate: 0,
      temperature: 0,
      weight: 0,
      height: 0
    },
    labResults: [{ testName: '', result: '', normalRange: '', unit: '', date: new Date().toISOString().split('T')[0] }],
    notes: '',
    followUpRequired: false,
    followUpDate: ''
  });

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      setIsLoading(true);
      const response = await doctorAPI.getPatient(patientId!);
      setPatient(response.data.data.patient);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch patient details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parentField: string, childField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField as keyof MedicalRecordForm] as any),
        [childField]: value
      }
    }));
  };

  const handleArrayChange = (field: string, index: number, subField: string, value: any) => {
    setFormData(prev => {
      const currentArray = prev[field as keyof MedicalRecordForm] as any[];
      return {
        ...prev,
        [field]: currentArray.map((item: any, i: number) => 
          i === index ? { ...item, [subField]: value } : item
        )
      };
    });
  };

  const addArrayItem = (field: string, defaultItem: any) => {
    setFormData(prev => {
      const currentArray = prev[field as keyof MedicalRecordForm] as any[];
      return {
        ...prev,
        [field]: [...currentArray, defaultItem]
      };
    });
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => {
      const currentArray = prev[field as keyof MedicalRecordForm] as any[];
      return {
        ...prev,
        [field]: currentArray.filter((_: any, i: number) => i !== index)
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Clean up empty array items
      const cleanedData = {
        ...formData,
        symptoms: formData.symptoms.filter(s => s.trim() !== ''),
        medications: formData.medications.filter(m => m.name.trim() !== ''),
        labResults: formData.labResults.filter(l => l.testName.trim() !== '')
      };

      await doctorAPI.addMedicalRecord(patientId, cleanedData);
      setSuccess('Medical record added successfully!');
      
      // Redirect to patient details after 2 seconds
      setTimeout(() => {
        navigate(`/doctor/patients/${patientId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add medical record');
    } finally {
      setIsSubmitting(false);
    }
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
                onClick={() => navigate('/doctor/dashboard')}
                className="mr-4 text-white hover:text-blue-200 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mr-3">
                <span className="text-xl">📝</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Add Medical Record</h1>
                <p className="text-white/90">
                  {patient ? `For ${patient.name} (${patient.patientId})` : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <p className="text-red-700">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
          >
            <p className="text-green-700">{success}</p>
          </motion.div>
        )}

        {/* Patient Info */}
        {patient && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 rounded-lg p-4 mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {patient.name}
              </div>
              <div>
                <span className="font-medium">Age:</span> {patient.age || 'N/A'} years
              </div>
              <div>
                <span className="font-medium">Blood Group:</span> {patient.bloodGroup || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Allergies:</span> {patient.allergies.join(', ') || 'None'}
              </div>
              <div>
                <span className="font-medium">Medical Issues:</span> {patient.medicalIssues.join(', ') || 'None'}
              </div>
            </div>
          </motion.div>
        )}

        {/* Medical Record Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Date *
                </label>
                <input
                  type="date"
                  value={formData.visitDate}
                  onChange={(e) => handleInputChange('visitDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Required
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.followUpRequired}
                    onChange={(e) => handleInputChange('followUpRequired', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Yes</span>
                </div>
              </div>
            </div>

            {formData.followUpRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Diagnosis and Treatment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnosis *
              </label>
              <input
                type="text"
                value={formData.diagnosis}
                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter diagnosis"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Treatment *
              </label>
              <textarea
                value={formData.treatment}
                onChange={(e) => handleInputChange('treatment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter treatment details"
                rows={3}
                required
              />
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptoms
              </label>
              {formData.symptoms.map((symptom, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={symptom}
                    onChange={(e) => handleArrayChange('symptoms', index, '', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter symptom"
                  />
                  {formData.symptoms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('symptoms', index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('symptoms', '')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Symptom
              </button>
            </div>

            {/* Vital Signs */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Vital Signs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Pressure (Systolic)
                  </label>
                  <input
                    type="number"
                    value={formData.vitalSigns.bloodPressure.systolic}
                    onChange={(e) => handleNestedInputChange('vitalSigns', 'bloodPressure', {
                      ...formData.vitalSigns.bloodPressure,
                      systolic: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Pressure (Diastolic)
                  </label>
                  <input
                    type="number"
                    value={formData.vitalSigns.bloodPressure.diastolic}
                    onChange={(e) => handleNestedInputChange('vitalSigns', 'bloodPressure', {
                      ...formData.vitalSigns.bloodPressure,
                      diastolic: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heart Rate (BPM)
                  </label>
                  <input
                    type="number"
                    value={formData.vitalSigns.heartRate}
                    onChange={(e) => handleNestedInputChange('vitalSigns', 'heartRate', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature (°F)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.vitalSigns.temperature}
                    onChange={(e) => handleNestedInputChange('vitalSigns', 'temperature', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any additional notes"
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/doctor/dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Adding Record...' : 'Add Medical Record'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddMedicalRecord;
